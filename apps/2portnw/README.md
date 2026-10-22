# 2portnw

A responsive two-port network parameter calculator for ECE students. The first screen records which port variables are known (V₁, I₁, V₂, I₂). The calculator then accepts one known 2×2 parameter matrix and converts between Z, Y, hybrid h, inverse hybrid g, and ABCD representations.

## Run locally
This is a dependency-free static web app. Open `index.html` in a browser, or serve this folder with any static HTTP server.

## Deploy to Vercel
Create a Vercel project connected to this repository and set the Root Directory to `apps/2portnw`. No build command is required; output the static files in the root directory.

## Engineering notes
- Variable selection alone does not uniquely determine a two-port network's parameters. A known parameter set or sufficient independent test measurements/equations are required.
- Singular conversions are reported rather than silently returning invalid values.
- Parameter conversion uses the convention stated on screen. ABCD is expressed as V₁ = A V₂ − B I₂ and I₁ = C V₂ − D I₂, with I₂ defined as entering port 2.
- The first release focuses on linear two-port parameter conversions. The passive/active physical realizability of a network is not automatically verified by matrix conversion.
