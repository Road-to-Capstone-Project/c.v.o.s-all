// types/next-auth.d.ts

import NextAuth, { DefaultSession, DefaultJWT } from "next-auth";

// Augment the Session and JWT types from NextAuth
declare module "next-auth" {
    interface Session {
        code?: string; // Add the 'code' property to the session
    }

    interface JWT {
        code?: string; // Add the 'code' property to the JWT
    }
}
