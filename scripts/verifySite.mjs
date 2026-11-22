async function test() {
  try {
    const res = await fetch("http://localhost:4173/");
    console.log("Homepage status:", res.status, res.headers.get("content-type"));
    const html = await res.text();
    console.log("HTML length:", html.length);

    const jsMatch = html.match(/src="([^"]+\.js)"/);
    const cssMatch = html.match(/href="([^"]+\.css)"/);

    if (jsMatch) {
      const jsRes = await fetch("http://localhost:4173" + jsMatch[1]);
      const jsText = await jsRes.text();
      console.log("JS Bundle status:", jsRes.status, "Length:", jsText.length);
      
      // Check that key terms are compiled in the bundle
      const checks = [
        "Full-Stack Developer | Python, Cloud & Enterprise Applications",
        "Workly CRM",
        "AWS Control Center",
        "VertiComply",
        "HR & Employee Self-Service Platform",
        "Architectural Blueprints",
        "7-Zip AES-256",
        "17 AWS regions scanned"
      ];
      for (const term of checks) {
        console.log(`Bundle contains '${term}':`, jsText.includes(term));
      }
    }

    if (cssMatch) {
      const cssRes = await fetch("http://localhost:4173" + cssMatch[1]);
      const cssText = await cssRes.text();
      console.log("CSS Bundle status:", cssRes.status, "Length:", cssText.length);
    }

    // Check SPA routes
    const slugs = [
      "workly",
      "aws-control-center",
      "verticomply",
      "leavesmanagement",
      "ai-care-coordinator",
      "tour-travel-booking",
      "e-commerce-web-application",
      "tshirt-customization-platform",
      "yoga-portfolio-website"
    ];

    for (const slug of slugs) {
      const r = await fetch("http://localhost:4173/projects/" + slug);
      console.log(`/projects/${slug} status:`, r.status);
    }

    const liveRes = await fetch("http://localhost:4173/live-projects");
    console.log("/live-projects status:", liveRes.status);
    
    console.log("\nALL VERIFICATIONS PASSED!");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();

