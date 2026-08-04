// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { emailOtp } from "./auth/emailOtp";

// Guest/anonymous login telah dihapus (PRIVAT — hanya akun admin yang disetujui
// bisa masuk lewat login nomor HP + password di src/convex/admin.ts).
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [emailOtp],
});
