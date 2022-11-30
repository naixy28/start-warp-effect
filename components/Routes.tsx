import { FC, useEffect } from "react";
import { useRouter } from "next/router";
import cls from "classnames";

const routeConfig = {
  "/": "Webgl / Interactive",
  "/interactive": "Canvas 2D / Interactive / Fake Perspective Projection",
};

export const Routes: FC = () => {
  const router = useRouter();
  console.log(router.pathname);
  const pathname = router.pathname;

  return (
    <div className="fixed bottom-4 left-4">
      <div className="text-white hover:cursor-pointer  font-medium font-mono flex flex-col items-start">
        {Object.entries(routeConfig).map(([key, val]) => (
          <div
            className={cls(
              'before:content-[">"] before:mr-2 mt-3 text-white/0 hover:text-white/100 transition-colors leading-5 backdrop-blur-[4px] [text-shadow:0_0_3px_white]',
              pathname === key ? "text-white/100" : ""
            )}
            key={key}
            onClick={() => router.push(key)}
          >
            {val}
          </div>
        ))}
      </div>
    </div>
  );
};
