import albumData from "./data/src/consts.json" with { type: "json" };

const albumJSONPath = `./data/albums/${albumData.album}/output/album_data_viz_${albumData.album}.json`;
const W = 900;
const H = 560;
const svg = d3.select("#chart");
const nodesG = svg.append("g");
const labelsG = svg.append("g");
const tooltip = d3.select("#tooltip");
let currentMode = "none";
let tracks = [];
let radius = null;
let palette = {};

// ---- Load data ----
d3.json(albumJSONPath)
  .then((records) => {
    tracks = records.map((d) => ({
      id: d.spotify_track_id,
      name: d.track_name,
      producer: d.primary_producer || "Unknown",
      mixer: d.primary_mixer || "Unknown",
      playCount: d.play_count,
      lastUpdated: d.play_count_last_updated,
      energy: d.audio_features.energy,
      dance: d.audio_features.danceability,
      valence: d.audio_features.valence,
      tempo: d.audio_features.tempo,
    }));

    console.log(tracks);

    // radius scale from YOUR data's actual range, not a hardcoded guess
    radius = d3
      .scaleSqrt()
      .domain(d3.extent(tracks, (d) => d.playCount))
      .range([6, 55]);

    palette = {
      producer: buildPalette(tracks, "producer"),
      mixer: buildPalette(tracks, "mixer"),
      none: { all: "#E3A72E" },
    };

    const updated = records.find((d) => d.lastUpdated)?.lastUpdated;
    d3.select("#lastUpdated").text(updated || "date not set");
    d3.select("#albumTitle").text(
      records.length ? "Bubble Spread" : "No tracks found",
    );

    render(currentMode);
    renderSmallMultiples();
  })
  .catch((err) => {
    console.error(err);
    d3.select("#loadError").style("display", "block");
    d3.select("#albumTitle").text("Data failed to load");
  });

function buildPalette(tracks, key) {
  const names = [...new Set(tracks.map((d) => d[key]))];
  const scale = d3.scaleOrdinal(d3.schemeTableau10).domain(names);
  const p = {};
  names.forEach((n) => (p[n] = scale(n)));
  return p;
}

// ---- Layout ----
function computeLayout(mode) {
  if (mode === "none") {
    const size = 420; // compact packing area, smaller than the 900x560 canvas
    const offsetX = (W - size) / 2;
    const offsetY = (H - size) / 2;
    const pack = d3.pack().size([size, size]).padding(3);
    const root = d3
      .hierarchy({ children: tracks })
      .sum((d) => radius(d.playCount) ** 2);
    pack(root);
    return {
      nodes: root
        .leaves()
        .map((l) => ({ ...l.data, x: l.x + offsetX, y: l.y + offsetY })),
      groups: [],
      cols: 1,
      cellW: W,
      cellH: H,
    };
  }
  const groups = d3.groups(tracks, (d) => d[mode]);
  const cols = Math.ceil(Math.sqrt(groups.length));
  const rows = Math.ceil(groups.length / cols);
  const cellW = W / cols,
    cellH = (H - 30) / rows;
  let out = [];
  groups.forEach(([key, items], i) => {
    const cx = (i % cols) * cellW + cellW / 2;
    const cy = 30 + Math.floor(i / cols) * cellH + cellH / 2;
    const pack = d3
      .pack()
      .size([cellW - 20, cellH - 30])
      .padding(5);
    const root = d3
      .hierarchy({ children: items })
      .sum((d) => radius(d.playCount) ** 2);
    pack(root);
    root.leaves().forEach((l) => {
      out.push({
        ...l.data,
        x: cx - (cellW - 20) / 2 + l.x,
        y: cy - (cellH - 30) / 2 + l.y + 10,
      });
    });
  });
  return { nodes: out, groups: groups.map((g) => g[0]), cols, cellW, cellH };
}

// ---- Render ----
function render(mode) {
  const layout = computeLayout(mode);
  const nodes = layout.nodes;

  labelsG.selectAll(".group-label").remove();
  if (mode !== "none") {
    layout.groups.forEach((g, i) => {
      const row = Math.floor(i / layout.cols);
      const cx = (i % layout.cols) * layout.cellW + layout.cellW / 2;
      const cy = 30 + row * layout.cellH + 12;
      labelsG
        .append("text")
        .attr("class", "group-label")
        .attr("x", cx)
        .attr("y", cy)
        .attr("text-anchor", "middle")
        .text(g);
    });
  }

  const sel = nodesG.selectAll("g.node").data(nodes, (d) => d.id);

  const enter = sel
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  enter
    .append("circle")
    .attr("r", (d) => radius(d.playCount))
    .attr(
      "fill",
      (d) =>
        palette[mode][d[mode] !== undefined ? d[mode] : "all"] || "#5B564A",
    )
    .attr("stroke", "#12100D")
    .attr("stroke-width", 1.5)
    .style("cursor", "pointer");

  const merged = enter.merge(sel);

  merged
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .style("left", event.clientX + 14 + "px")
        .style("top", event.clientY + 14 + "px")
        .html(
          `<b>${d.name}</b><br>Producer: ${d.producer}<br>Mixer: ${d.mixer}<br>Play Count: ${d.playCount}`,
        );
    })
    .on("mouseleave", () => tooltip.style("opacity", 0))
    .transition()
    .duration(750)
    .ease(d3.easeCubicInOut)
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  merged
    .select("circle")
    .transition()
    .duration(750)
    .ease(d3.easeCubicInOut)
    .attr("r", (d) => radius(d.playCount))
    .attr(
      "fill",
      (d) =>
        palette[mode][d[mode] !== undefined ? d[mode] : "all"] || "#5B564A",
    );

  sel.exit().remove();
  renderLegend(mode);
}

function renderLegend(mode) {
  const entries = Object.entries(palette[mode] || {});
  const legend = d3.select("#legend");
  legend.selectAll("*").remove();
  entries.forEach(([key, color]) => {
    const item = legend.append("span");
    item.append("span").attr("class", "swatch").style("background", color);
    item.append("span").text(key === "all" ? "All tracks" : key);
  });
}

d3.selectAll(".controls button").on("click", function () {
  const mode = d3.select(this).attr("data-mode");
  currentMode = mode;
  d3.selectAll(".controls button").classed("active", false);
  d3.select(this).classed("active", true);
  render(mode);
});

// ---- Small multiples ----
function renderSmallMultiples() {
  const features = [
    { key: "energy", label: "Energy" },
    { key: "dance", label: "Danceability" },
    { key: "valence", label: "Valence" },
    { key: "tempo", label: "Tempo (BPM)" },
  ];
  const smContainer = d3.select("#smallMultiples");
  smContainer.selectAll("*").remove();

  features.forEach((f) => {
    const cell = smContainer.append("div").attr("class", "sm-cell");
    cell.append("p").attr("class", "sm-title").text(f.label);
    const w = 240,
      h = 90,
      m = { t: 6, r: 6, b: 6, l: 6 };
    const svgSm = cell
      .append("svg")
      .attr("viewBox", `0 0 ${w} ${h}`)
      .style("width", "100%")
      .style("display", "block");

    const x = d3
      .scalePoint()
      .domain(tracks.map((d, i) => i))
      .range([m.l, w - m.r]);
    const yDomain =
      f.key === "tempo" ? d3.extent(tracks, (d) => d.tempo) : [0, 1];
    const y = d3
      .scaleLinear()
      .domain(yDomain)
      .range([h - m.b, m.t]);

    const line = d3
      .line()
      .x((d, i) => x(i))
      .y((d) => y(d[f.key]))
      .curve(d3.curveMonotoneX);

    svgSm
      .append("path")
      .datum(tracks)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#E3A72E")
      .attr("stroke-width", 2);

    svgSm
      .selectAll("circle")
      .data(tracks)
      .enter()
      .append("circle")
      .attr("cx", (d, i) => x(i))
      .attr("cy", (d) => y(d[f.key]))
      .attr("r", 2.5)
      .attr("fill", "#EDE3D0");
  });
}
