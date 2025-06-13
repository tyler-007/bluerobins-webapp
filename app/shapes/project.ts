import { ShapeStreamOptions } from "@electric-sql/client/*";

export type ProjectProps = {
  agenda: { description: string }[];
  categories: string[];
  cost_price: number;
  selling_price: number;
  description: string;
  filled_spots: number;
  mentor_user: string;
  prerequisites: { title: string; url: string }[];
  session_day: string;
  session_time: string;
  session_count: number;
  spots: number;
  start_date: string;
  title: string;
  tools: { title: string; url: string }[];
};

export const getProjectShape = (package_id: number): ShapeStreamOptions => {
  if (typeof window !== `undefined`) {
    return {
      url: new URL(`/shape-proxy`, window?.location.origin).href,
      params: {
        table: `projects`,
        where: `id = $1`,
        params: {
          "1": package_id.toString(),
        },
      },
    };
  } else {
    return {
      url: new URL(`https://not-sure-how-this-works.com/shape-proxy`).href,
      params: {
        table: `projects`,
      },
    };
  }
};
