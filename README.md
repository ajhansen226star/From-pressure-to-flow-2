# From Pressure to Flow

An AI-assisted educational website about force balances, Newtonian viscosity, velocity gradients, shear stress, volumetric flow rate, and microfluidic mixing.

## Publish the demo

Put these files at the top level of a public GitHub repository. In **Settings → Pages**, select **Deploy from a branch → main → / (root)**. Open the site URL shown under **Visit site**.

On the live GitHub Pages site, go to **AI & process → Presentation & verbatim transcript → Edit presentation**. The editor accepts a YouTube video link and the exact transcript as pasted text or a UTF-8 `.txt`, `.vtt`, or `.srt` file. Publish with a fine-grained token scoped to this repository with **Contents: Read and write**. GitHub saves a commit to `presentation.json` and redeploys the site. A later upload of an empty `presentation.json` would replace published content.

[Configure GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Create a fine-grained token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

## Computation

- **Flow fundamentals.** Steady, fully developed, incompressible Newtonian flow through a horizontal circular pipe. The embedded original WebAssembly kernel implements Hagen–Poiseuille flow.
- **Microfluidic mixing.** An analytical Fourier-series solution and finite-volume predictions for an idealized transverse-diffusion model.
- **JavaScript versus Rust/WebAssembly.** The benchmark compares matched calculations using a Rust-compiled reference kernel. A separate Rust-compiled evaluator runs visitors’ edited arithmetic in the browser. This lets the editor run on GitHub Pages without a compiler service.

`index.html` bundles the interactive lessons and their WebAssembly modules and opens locally in a modern browser. The presentation content and owner editor use the neighboring presentation files on the hosted site.
