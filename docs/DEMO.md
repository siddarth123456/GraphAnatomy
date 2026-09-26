# GraphAnatomy: three-minute live demo

## Before presenting

Use Node.js 22+. From the project root:

```sh
npm ci
npm run build
npm start
```

Open `http://localhost:3000` and leave the server running. The bundled demo needs no database, credentials, or seed step. Confirm the hand loads and the welcome panel shows **190 3D structures** and **599 Cited relationships**. **Catalog coverage** shows another **202 entries without 3D**. Use a desktop-sized window; on narrow screens, use **Open controls** for viewer controls.

Rehearse once, open a citation while online, then click **Reset view**. For an offline presentation, prepare a saved copy of the citation and label it as a saved reference.

## Live sequence

| Time | Action | Say |
| --- | --- | --- |
| 0:00–0:20 | Start in **Explore**, rotate and zoom briefly. Show **Catalog coverage**. | “This right-hand and wrist atlas connects 190 source models with a catalog of 392 anatomical entries and 599 cited relationships.” |
| 0:20–1:05 | Choose **Skeleton**, search **scaphoid**, and select it. Check and uncheck **Isolate selected structure**. Briefly move **Exploded view**, then return it to zero. Enable **Cross section**, move **Section position**, then click **Reset view**. | “Selection, isolation, and sectioning help inspect the geometry. Sectioning clips the model; it is not a medical scan.” |
| 1:05–1:40 | Choose **Nerves & vessels**. Search **Right median nerve** and choose that exact result. Isolate it, then uncheck isolation. Expand **3D source and license**. Optionally choose **Surface** to show skin and nails, then reset. | “The expansion adds real nerves, vessels, ligaments, fascia, and skin from licensed atlas sources. Each model identifies its source.” |
| 1:40–2:10 | Search **Right recurrent branch of median nerve**. Point to **Graph entry · No 3D model**. Under **Connected anatomy**, select **Abductor Pollicis Brevis** from the innervation relationship. | “A named branch can have a cited graph entry without independent geometry. We preserve that distinction and follow the connection to its muscle.” |
| 2:10–2:50 | Open **Find evidence**. Run **What innervates abductor pollicis brevis?** Show the recurrent-median branch result and open its citation. Return to the app. | “This retrieves a direct source-backed connection. Parent nerves and named branches remain distinct, and the service does not infer unlisted downstream anatomy.” |
| 2:50–3:00 | Finish on the evidence result. | “This is a gross-anatomy educational atlas with explicit geometry gaps. Retrieval is deterministic and one hop; it does not generate diagnoses.” |

## Keep the scope precise

- **190 meshes does not mean 392 independent models.** The other 202 anatomical entries remain searchable without a separate mesh; one additional clinical-condition node is separate from those counts.
- Groups such as lumbricals, digital branches, and nail plates retain their original grouped geometry. Individual members do not receive copies of the group mesh. Search **Right lumbrical 1 of hand**, then follow its `PART_OF` connection for an example.
- Some original ligament objects are low-polygon source surfaces. Their selection note states that anatomical thickness is not modeled.
- The 93 BodyParts3D assets use **CC BY 4.0**; the 97 Z-Anatomy assets use **CC BY-SA 4.0**. Their atlas alignment is measured against shared bones, not certified for patient anatomy.
- Evidence is limited to the curated graph. Full-body anatomy, microscopic completeness, every branching variant, vector retrieval, and an AI tutor are outside this release. The [coverage checklist](HAND_COVERAGE.md) records the remaining gaps.

## Recovery during the demo

- **Internet unavailable:** keep the local server running. Bundled models, catalog, retrieval, and the local Draco decoder need no remote asset download. External citations need internet; show the title or a clearly labeled saved reference.
- **Unexpected selection or camera:** click **Reset view**, choose **Skeleton**, and search **scaphoid** again. Press **Escape** to clear selection or dismiss mobile controls. Reset hides skin and fascia so deeper structures remain visible.
- **Catalog error:** click **Retry catalog**. If it persists, check the server terminal and reload.
- **Evidence request fails:** retry the APB question once. If needed, select **Abductor Pollicis Brevis** in Explore and show its cited recurrent-median innervation under **Connected anatomy**. Explain that this is the same source graph; do not claim the request succeeded.
- **3D rendering fails:** reload once. If needed, continue through **Knowledge graph** and its searchable node directory, stating that the device's 3D view is unavailable.
