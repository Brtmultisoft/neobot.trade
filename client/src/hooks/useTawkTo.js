import { useEffect } from "react";

const useTawkTo = () => {
  useEffect(() => {
    if (!document.getElementById("tawkto-script")) {
      const s1 = document.createElement("script");
      s1.id = "tawkto-script";
      s1.async = true;
      s1.src = "https://embed.tawk.to/6863cb3f89d0b51907b141a9/1iv2t3t4j";
      s1.charset = "UTF-8";
      s1.setAttribute("crossorigin", "*");
      document.body.appendChild(s1);
    }
  }, []);
};

export default useTawkTo; 