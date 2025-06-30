/*
import { ShapeStreamOptions } from "@electric-sql/client/*";

export type UserProfileProps = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

export const getUserProfile = (user_id: string): ShapeStreamOptions => {
  console.log("getUserProfile called with:", user_id, "window:", typeof window);
  if (typeof window !== `undefined`) {
    if (!user_id) {
      return {
        url: new URL(`https://not-sure-how-this-works.com/shape-proxy`).href,
        params: {
          table: `profiles`,
        },
      };
    }
    return {
      url: new URL(`/shape-proxy`, window?.location.origin).href,
      params: {
        table: `profiles`,
        where: `id = $1`,
        params: {
          "1": user_id,
        },
      },
    };
  } else {
    return {
      url: new URL(`https://not-sure-how-this-works.com/shape-proxy`).href,
      params: {
        table: `profiles`,
      },
    };
  }
};
*/
