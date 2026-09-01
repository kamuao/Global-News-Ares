// World map rendering: SVG + D3 geo projection over public-domain
// Natural Earth topography (vendored from the world-atlas npm package,
// see vendor/geo/world-atlas-LICENSE.txt).

import { sound } from "./sound.js";

const CONFLICT_GLYPH = {
  war: "⚔", // crossed swords
  "territorial-dispute": "⚠", // warning triangle
  "occupied-territory": "⛓", // chain
};

export async function createMap({ svgEl, store, onSelectCountry, onSelectConflict, onSelectSubregion }) {
  const d3g = window.d3;
  const topojson = window.topojson;

  const topo = await (await fetch("vendor/geo/countries-110m.json", { cache: "force-cache" })).json();
  const geo = topojson.feature(topo, topo.objects.countries);
  const graticule = d3g.geoGraticule10();

  const svg = d3g.select(svgEl);
  const root = svg.append("g").attr("class", "map-root");
  const gGraticule = root.append("path").datum(graticule).attr("class", "graticule");
  const gSphere = root.append("path").datum({ type: "Sphere" }).attr("class", "sphere-outline");
  const gCountries = root.append("g").attr("class", "layer-countries");
  const gSubregions = root.append("g").attr("class", "layer-subregions");
  const gConflicts = root.append("g").attr("class", "layer-conflicts");

  const projection = d3g.geoNaturalEarth1();
  const path = d3g.geoPath(projection);

  let width = 0;
  let height = 0;
  let selectedNumericId = null;

  const zoom = d3g.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      root.attr("transform", event.transform);
    });

  svg.call(zoom);

  function resize() {
    const rect = svgEl.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    projection.fitExtent(
      [
        [16, 16],
        [width - 16, height - 16],
      ],
      geo
    );
    draw();
  }

  function countryClass(d) {
    const meta = store.countriesByNumericId[d.id];
    const classes = ["country-shape"];
    classes.push(meta && meta.hasData ? "has-data" : "no-data");
    if (d.id === selectedNumericId) classes.push("selected");
    return classes.join(" ");
  }

  function draw() {
    gGraticule.attr("d", path);
    gSphere.attr("d", path);

    gCountries
      .selectAll("path")
      .data(geo.features, (d) => d.id)
      .join("path")
      .attr("d", path)
      .attr("class", countryClass)
      .attr("data-id", (d) => d.id)
      .on("click", (event, d) => {
        event.stopPropagation();
        const meta = store.countriesByNumericId[d.id];
        if (meta && meta.hasData) {
          sound.confirm();
          selectCountryById(d.id);
          showSubregions(meta.iso3);
          onSelectCountry(meta.iso3);
        } else {
          sound.deny();
        }
      })
      .append("title")
      .text((d) => {
        const meta = store.countriesByNumericId[d.id];
        return meta ? `${meta.flag || ""} ${meta.name}${meta.hasData ? "" : " (no feed configured)"}` : d.properties.name;
      });

    drawConflicts();
  }

  function drawConflicts() {
    const markers = gConflicts
      .selectAll("g.conflict-marker")
      .data(store.conflicts, (d) => d.id)
      .join((enter) => {
        const g = enter.append("g").attr("class", (d) => `conflict-marker type-${d.type}`);
        g.append("circle").attr("class", "marker-ring").attr("r", 6);
        g.append("circle").attr("r", 3.4).attr("class", "marker-core").attr("fill", "currentColor");
        g.append("text")
          .attr("class", "marker-glyph")
          .attr("text-anchor", "middle")
          .attr("dy", "-8")
          .attr("font-size", "10")
          .attr("fill", "currentColor")
          .text((d) => CONFLICT_GLYPH[d.type] || "?");
        return g;
      });

    markers
      .attr("transform", (d) => {
        const p = projection([d.lon, d.lat]);
        return p ? `translate(${p[0]},${p[1]})` : "translate(-9999,-9999)";
      })
      .style("color", (d) =>
        d.type === "war" ? "var(--accent-red)" : d.type === "territorial-dispute" ? "var(--accent-amber)" : "var(--accent-purple)"
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        sound.alert();
        onSelectConflict(d.id);
      });

    markers.select("title").remove();
    markers.append("title").text((d) => `${d.name} (${d.type.replace("-", " ")})`);
  }

  function selectCountryById(numericId) {
    selectedNumericId = numericId;
    gCountries.selectAll("path").attr("class", countryClass);
  }

  function clearSelection() {
    selectedNumericId = null;
    gCountries.selectAll("path").attr("class", countryClass);
    gSubregions.selectAll("*").remove();
  }

  function showSubregions(iso3) {
    gSubregions.selectAll("*").remove();
    const entries = Object.entries(store.subregions).filter(([, s]) => s.parent === iso3);
    const g = gSubregions
      .selectAll("g.subregion-marker")
      .data(entries, ([id]) => id)
      .join((enter) => {
        const grp = enter.append("g").attr("class", "subregion-marker");
        grp.append("circle").attr("r", 4.5);
        return grp;
      });

    g.attr("transform", ([, s]) => {
      const p = projection([s.lon, s.lat]);
      return p ? `translate(${p[0]},${p[1]})` : "translate(-9999,-9999)";
    }).on("click", (event, [id]) => {
      event.stopPropagation();
      sound.confirm();
      onSelectSubregion(id);
    });

    g.select("title").remove();
    g.append("title").text(([, s]) => s.name);
  }

  function focusOnNumericId(numericId, scale = 3.2) {
    const feature = geo.features.find((f) => f.id === numericId);
    if (!feature) return;
    const [[x0, y0], [x1, y1]] = path.bounds(feature);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;
    const s = Math.max(1, Math.min(scale, 0.85 / Math.max(dx / width, dy / height)));
    const translate = [width / 2 - s * x, height / 2 - s * y];
    svg
      .transition()
      .duration(650)
      .call(zoom.transform, d3g.zoomIdentity.translate(translate[0], translate[1]).scale(s));
  }

  svg.on("click", () => {
    // clicking empty ocean/background clears nothing by itself; handled by app.js UI close button
  });

  window.addEventListener("resize", resize);
  resize();

  return {
    focusCountry(iso3) {
      const entry = Object.entries(store.countriesByNumericId).find(([, m]) => m.iso3 === iso3);
      if (entry) {
        selectCountryById(entry[0]);
        focusOnNumericId(entry[0]);
        showSubregions(iso3);
      }
    },
    focusConflict(lon, lat) {
      const p = projection([lon, lat]);
      if (!p) return;
      const s = 3;
      const translate = [width / 2 - s * p[0], height / 2 - s * p[1]];
      svg.transition().duration(650).call(zoom.transform, d3g.zoomIdentity.translate(translate[0], translate[1]).scale(s));
    },
    clearSelection,
    zoomIn() {
      svg.transition().duration(200).call(zoom.scaleBy, 1.5);
    },
    zoomOut() {
      svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.5);
    },
    zoomReset() {
      svg.transition().duration(300).call(zoom.transform, d3g.zoomIdentity);
    },
  };
}
