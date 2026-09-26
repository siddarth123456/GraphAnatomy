# GraphAnatomy: three-minute live demo

## Before presenting

Use Node.js 22 or newer. From the project root, install dependencies and build before the session:

```sh
npm ci
npm run build
npm start
```

Open `http://localhost:3000`. Leave the terminal running. The default bundled demo needs no database, credentials, or seed step. Confirm the header says **Hand anatomy demo**, the hand loads, and the welcome panel shows **31 3D structures** and **25 Cited relationships**. Use a desktop-sized window; on a narrow screen, open **Open controls** to reach viewer controls.

Rehearse the sequence once, open a citation while online, then return to the app and click **Reset view**. If presenting without internet, save a screenshot or PDF of that citation beforehand and label it as a saved reference.

## Live sequence

| Time | Action | Say |
| --- | --- | --- |
| 0:00–0:15 | Start in **Explore** with the whole hand visible. Drag briefly to rotate; scroll to zoom. | “GraphAnatomy connects a 3D hand with a small, cited anatomy graph.” |
| 0:15–1:15 | Search **scaphoid** and select its result. Show its metadata. Check **Isolate selected structure**, then uncheck it. Move **Exploded view** a little, then return it to zero. Enable **Cross section**, move **Section position**, and briefly change **Section plane** if useful. Click **Reset view**. | “Selection connects the model to its description and relationships. Isolation, explosion, and sectioning help inspect the geometry.” |
| 1:15–2:05 | Select **Median Nerve** from **Start exploring**, then open **Knowledge graph**. Point to **Graph entry · No 3D model**. In **Connected anatomy**, find the median nerve → **Abductor Pollicis Brevis** innervation relationship. Click the muscle name to select its 3D model. | “The median nerve is a graph entry in this release. Its connection to abductor pollicis brevis takes us back to a structure we can inspect in 3D.” |
| 2:05–2:50 | Open **Find evidence**. Click the built-in question **What muscles are innervated by the median nerve?** Show the returned relationship and click its citation title. Return to the app tab. | “This retrieves a curated connection and its source. The result is limited to the relationships included in this catalog.” |
| 2:50–3:00 | Finish on the evidence result. | “This MVP has 31 3D assets and 25 sourced relationships. Retrieval is deterministic and one hop; it uses no LLM or vector search and does not provide diagnoses.” |

## Keep the scope precise

- The 31 3D assets are **29 bones, the radial artery, and abductor pollicis brevis**. This is a hand anatomy slice, not a complete hand atlas.
- The **median nerve has no 3D model**. Do not imply that its graph location represents an anatomical position.
- Evidence comes from the curated graph. It is not an exhaustive answer, generated medical advice, or spatial reasoning.
- Viewer sectioning clips the displayed geometry; it is not a scan or a clinical simulation.

## Recovery during the demo

- **Internet unavailable:** keep the local server running. The bundled catalog, models, and local Draco decoder support the model demo without remote model downloads. Local retrieval still uses the bundled graph. External citation pages need internet: show the citation title and, if prepared, the saved reference; state that the publisher page cannot be fetched live.
- **Unexpected selection or camera state:** click **Reset view**, then search **scaphoid** again. Press **Escape** to clear selection or dismiss the mobile controls.
- **Catalog error:** click **Retry catalog**. If it persists, check the local server terminal and reload the page.
- **Evidence request fails:** retry the built-in median nerve question once. If it still fails, open **Explore**, select **Median Nerve**, and show the cited innervation relationship under **Connected anatomy**. Explain that this is the same curated source graph; do not claim the request succeeded.
- **3D rendering fails:** reload once. If needed, continue with the graph and cited metadata and state that the 3D view is unavailable on that device.
