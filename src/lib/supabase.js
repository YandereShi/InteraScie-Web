import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export async function InvokeStudentManagement(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke(
    "studentmanagement",
    {
      body: {
        action,
        ...payload,
      },
    }
  );

  if (error) {
    let message = error.message;

    try {
      const body = await error.context?.json();
      message = body?.error ?? message;
    } catch {
      message = error.message;
    }

    throw new Error(message);
  }

  if (!data) {
    throw new Error("The student request returned no result.");
  }

  return data;
}
