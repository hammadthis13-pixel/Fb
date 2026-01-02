export default {
  async fetch(request) {
    const url = new URL(request.url);
    const fbUrl = url.searchParams.get("url");

    // 1️⃣ Validate URL
    if (
      !fbUrl ||
      (!fbUrl.includes("facebook.com") && !fbUrl.includes("fb.watch"))
    ) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Invalid Facebook URL"
        }, null, 2),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ Single Ultra-Fast API Source
    const api = `https://fb.bdbots.xyz/dl?url=${encodeURIComponent(fbUrl)}`;

    try {
      const res = await fetch(api, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        }
      });

      if (!res.ok) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Facebook API failed"
          }, null, 2),
          { status: 502 }
        );
      }

      const data = await res.json();

      if (data.status !== "success" || !data.downloads) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Invalid API response"
          }, null, 2),
          { status: 500 }
        );
      }

      // 3️⃣ Extract HD & SD
      const hd = data.downloads.find(v => v.quality === "HD") || null;
      const sd = data.downloads.find(v => v.quality === "SD") || null;

      // 4️⃣ Final API Response
      return new Response(
        JSON.stringify({
          status: "success",
          title: data.title || null,
          hd: hd ? hd.url : null,
          sd: sd ? sd.url : null,
          channel: "@old_studio786"
        }, null, 2),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store"
          }
        }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Server crash",
          error: err.message
        }, null, 2),
        { status: 500 }
      );
    }
  }
};
      if (cobaltResponse.ok) {
        const data = await cobaltResponse.json();
        // Cobalt ka response structure simple hota hai
        if (data.url) {
          finalResult = {
            video: data.url,
            thumbnail: null, // Cobalt hamesha thumb nahi deta
            title: "Facebook Video",
            method: "Cobalt API"
          };
        }
      }
    } catch (err) {
      console.log(`Cobalt API failed: ${err.message}`);
    }

    // --- METHOD 2: Direct HTML Scraping (Fallback for Public Videos) ---
    if (!finalResult) {
      try {
        console.log('Trying Method 2: Direct Scraping');
        // User-Agent change karna zaroori hai taaki FB bot na samjhe
        const scrapeResponse = await fetch(inputUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          }
        });

        if (scrapeResponse.ok) {
          const html = await scrapeResponse.text();
          
          // Regex se video URL dhoondhte hain (HD aur SD)
          // FB source code mein "hd_src":"..." ya "sd_src":"..." hota hai
          const hdMatch = html.match(/"hd_src":"([^"]+)"/);
          const sdMatch = html.match(/"sd_src":"([^"]+)"/);
          
          // Video URL aksar encoded hota hai (\u0026), usko decode karna padega
          const cleanUrl = (encodedUrl) => {
            if (!encodedUrl) return null;
            return encodedUrl.replace(/\\u0026/g, '&').replace(/\\/g, '');
          };

          const videoUrl = cleanUrl(hdMatch ? hdMatch[1] : (sdMatch ? sdMatch[1] : null));

          if (videoUrl) {
             // Title dhoondhne ki koshish (og:title)
             const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
             
             finalResult = {
               video: videoUrl,
               thumbnail: null,
               title: titleMatch ? titleMatch[1] : "Facebook Scraped Video",
               method: "Direct Scrape"
             };
          }
        }
      } catch (err) {
        console.log(`Direct Scrape failed: ${err.message}`);
      }
    }

    // --- Final Response Output ---
    if (finalResult && finalResult.video) {
      return new Response(
        JSON.stringify({
          status: 'success',
          video: finalResult.video,
          thumbnail: finalResult.thumbnail,
          title: finalResult.title,
          method: finalResult.method,
          channel: '@old_studio786'
        }, null, 2),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Agar sab fail ho jaye
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Failed to fetch video. Ensure link is public and valid.',
        tips: 'Try a public Reel or Watch link. Private groups/profiles cannot be downloaded via API.',
        channel: '@old_studio786'
      }, null, 2),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
