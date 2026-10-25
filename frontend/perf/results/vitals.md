# Real page loads under phone throttling

`node perf/vitals.mjs <base> <path> 5`: Chrome with Slow 4G (150 ms latency, 1.6 Mbps) and 4x CPU slowdown applied for real, median of 5 cold loads. The Week 4 build (`74732f7`) was served on port 4174 and the Week 5 build on 4173, against the same API and data, one after the other.

| Page    | Build  | First paint | Largest paint | Layout shift |
| ------- | ------ | ----------: | ------------: | -----------: |
| Landing | Week 4 |    1,856 ms |      2,684 ms |        0.075 |
| Landing | Week 5 |    1,772 ms |      2,632 ms |        0.000 |
| Browse  | Week 4 |    1,748 ms |      2,448 ms |        0.117 |
| Browse  | Week 5 |    1,656 ms |      2,340 ms |        0.020 |

Lighthouse's simulated mobile run (`lighthouse-after.md`) shows the largest paint 0.3 to 0.4 s later for Week 5. Its simulation rebuilds the page load from a fast trace and counts the SignalR chunk (now a separate, later request) and the fallback font in the loading chain. In real loads both pages paint slightly earlier, as above.
