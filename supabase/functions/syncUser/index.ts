import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Permit } from "npm:permitio";

 const corsHeaders = {
  'Access-Control-Allow-Origin': "*",
  'Access-Control-Allow-Headers': 'Authorization, x-client-info, apikey, Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

Deno.serve(async (req) => {
   const permit = new Permit({
    token: Deno.env.get("PERMIT_API_KEY"),
    pdp: "https://realtime-polling-app-nextjs-supabase-permitio-production.up.railway.app",
   });
  
  try {
    const { event, user } = await req.json();

    // Only proceed if the event type is "SIGNED_UP"
    if (event === "SIGNED_UP" && user) {
      const newUser = {
        key: user.id,
        email: user.email,
        name: user.user_metadata?.name || "Someone",
      };

      // Sync the user to Permit.io
      await permit.api.createUser(newUser);
      await permit.api.assignRole({
        role: "authenticated",
        tenant: "default",
        user: user.id,
      });

      console.log(`User ${user.email} synced to Permit.io successfully.`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ message: "User synced successfully!" }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Error syncing user to Permit: ", error);
    return new Response(
      JSON.stringify({
        message: "Error syncing user to Permit.",
        "error": error
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
