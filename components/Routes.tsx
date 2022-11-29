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
      <div className="text-white hover:cursor-pointer  font-medium font-mono ">
        {Object.entries(routeConfig).map(([key, val]) => (
          <div
            className={cls(
              'before:content-[">"] before:mr-2 mt-3 opacity-70 hover:opacity-100 transition-opacity leading-5',
              pathname === key ? "opacity-100" : ""
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
