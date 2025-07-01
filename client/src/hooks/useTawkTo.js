import { useEffect } from "react";

const useTawkTo = () => {
  useEffect(() => {
    // Hide widget on home page
    if (window.location.pathname === "/") return;

    // Only show on screens wider than 350px (to allow mobile)
    if (!document.getElementById("tawkto-script")) {
      const s1 = document.createElement("script");
      s1.id = "tawkto-script";
      s1.async = true;
      s1.src = "https://embed.tawk.to/6863cb3f89d0b51907b141a9/1iv2t3t4j";
      s1.charset = "UTF-8";
      s1.setAttribute("crossorigin", "*");
      document.body.appendChild(s1);
    }

    // Add bottom margin on mobile
    const addMargin = () => {
      if (window.innerWidth < 768) {
        document.body.style.marginBottom = "80px"; // adjust as needed
      }
    };
    addMargin();
    window.addEventListener("resize", addMargin);
    return () => {
      window.removeEventListener("resize", addMargin);
      document.body.style.marginBottom = "";
    };
  }, []);
};

export default useTawkTo; 