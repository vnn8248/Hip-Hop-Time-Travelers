import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const data = await d3.csv(
  "data/track_list_w_audio_feats_and_play_counts_Like Water For Chocolate.csv",
);

const palette = {
  producer: {
    "The Architect": "#E3A72E",
    "K. Osei": "#B4482E",
    "R. Vance": "#4F7867",
  },
  mixer: { "D. Ross": "#E3A72E", "M. Finch": "#B4482E" },
  sampleEra: {
    "60s": "#4F7867",
    "70s": "#E3A72E",
    "80s": "#B4482E",
    none: "#5B564A",
  },
  none: { all: "#E3A72E" },
};

const width = 900;
const height = 560;

const svg = d3.select("#chart")