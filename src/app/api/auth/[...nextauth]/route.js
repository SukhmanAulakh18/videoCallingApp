import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // JWT callback to include user ID and access token in the token
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    // Session callback to include user ID from token
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.image = token.picture;
      return session;
    },
    // Sign-in callback to check if the user exists or create a new one
    async signIn({ user, profile }) {
      await dbConnect();
      let dbUser = await User.findOne({ email: user.email });

      // If user not found, create a new user
      if (!dbUser) {
        dbUser = await User.create({
          name: user.name || profile.name,
          email: user.email,
          profilePicture: user.image || profile.picture,
          isVerified: profile.email_verified || false,
        });
      }
      // Assign dbUser._id to user object
      user.id = dbUser._id.toString();
      return true;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 90 * 24 * 60 * 60, // 90 days
  },
  pages: {
    signIn: '/user-auth',
  },
};

const handle = NextAuth(authOptions);
export { handle as POST, handle as GET };
