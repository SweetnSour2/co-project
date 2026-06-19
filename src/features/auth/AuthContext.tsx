import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { Timestamp, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth, db, isFirebaseConfigured } from "../../lib/firebase/client";
import { preferencesDoc, userDoc } from "../../lib/firebase/paths";
import type { StudyPreferences, UserProfile } from "../../types";

interface DemoUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  getIdToken: () => Promise<string>;
}

type AppUser = User | DemoUser;

interface AuthContextValue {
  user: AppUser | null;
  profile: UserProfile | null;
  preferences: StudyPreferences | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  completeOnboarding: (
    updates: Omit<StudyPreferences, "updatedAt"> & { displayName: string },
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const demoAuthKey = "studypilot-demo:auth";

function defaultPreferences(): StudyPreferences {
  return {
    preferredStudyStartHour: 16,
    preferredStudyEndHour: 21,
    preferredSessionMinutes: 25,
    burnoutSensitivity: "medium",
    maxDailyStudyMinutes: 240,
    updatedAt: Timestamp.now(),
  };
}

function makeDemoUser(name = "Demo Student", email = "demo@student.local"): DemoUser {
  return {
    uid: "demo-user",
    email,
    displayName: name,
    getIdToken: async () => "demo-token",
  };
}

function makeDemoProfile(user: DemoUser): UserProfile {
  const now = Timestamp.now();
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "Demo Student",
    createdAt: now,
    updatedAt: now,
    onboardingCompleted: true,
  };
}

async function ensureProfile(user: User) {
  const ref = userDoc(user.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  await setDoc(ref, {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "Student",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    onboardingCompleted: false,
  });

  await setDoc(preferencesDoc(user.uid), {
    preferredStudyStartHour: 16,
    preferredStudyEndHour: 21,
    preferredSessionMinutes: 25,
    burnoutSensitivity: "medium",
    maxDailyStudyMinutes: 240,
    updatedAt: serverTimestamp(),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<StudyPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      const stored = window.localStorage.getItem(demoAuthKey);
      const demoUser = stored
        ? makeDemoUser(JSON.parse(stored).displayName, JSON.parse(stored).email)
        : makeDemoUser();
      window.localStorage.setItem(
        demoAuthKey,
        JSON.stringify({
          displayName: demoUser.displayName,
          email: demoUser.email,
        }),
      );
      setUser(demoUser);
      setProfile(makeDemoProfile(demoUser));
      setPreferences(defaultPreferences());
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        await ensureProfile(nextUser);
      } else {
        setProfile(null);
        setPreferences(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    const unsubscribeProfile = onSnapshot(userDoc(user.uid), (snapshot) => {
      setProfile(snapshot.exists() ? snapshot.data() : null);
    });
    const unsubscribePreferences = onSnapshot(preferencesDoc(user.uid), (snapshot) => {
      setPreferences(snapshot.exists() ? snapshot.data() : null);
    });

    return () => {
      unsubscribeProfile();
      unsubscribePreferences();
    };
  }, [user]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!isFirebaseConfigured || !auth || !db) {
      const demoUser = makeDemoUser(name || "Demo Student", email || "demo@student.local");
      window.localStorage.setItem(
        demoAuthKey,
        JSON.stringify({ displayName: demoUser.displayName, email: demoUser.email }),
      );
      setUser(demoUser);
      setProfile(makeDemoProfile(demoUser));
      setPreferences(defaultPreferences());
      return;
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await setDoc(
      doc(db, "users", credential.user.uid),
      {
        displayName: name,
        email,
        uid: credential.user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onboardingCompleted: false,
      },
      { merge: true },
    );
  }, []);

  const logIn = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      const stored = window.localStorage.getItem(demoAuthKey);
      const demoUser = stored
        ? makeDemoUser(JSON.parse(stored).displayName, JSON.parse(stored).email)
        : makeDemoUser("Demo Student", email || "demo@student.local");
      setUser(demoUser);
      setProfile(makeDemoProfile(demoUser));
      setPreferences(defaultPreferences());
      return;
    }

    const credential = await signInWithEmailAndPassword(auth, email, password);
    await ensureProfile(credential.user);
  }, []);

  const logOut = useCallback(async () => {
    if (!isFirebaseConfigured || !auth) {
      window.localStorage.removeItem(demoAuthKey);
      const demoUser = makeDemoUser();
      window.localStorage.setItem(
        demoAuthKey,
        JSON.stringify({ displayName: demoUser.displayName, email: demoUser.email }),
      );
      setUser(demoUser);
      setProfile(makeDemoProfile(demoUser));
      setPreferences(defaultPreferences());
      return;
    }

    await signOut(auth);
  }, []);

  const completeOnboarding = useCallback(
    async (
      updates: Omit<StudyPreferences, "updatedAt"> & {
        displayName: string;
      },
    ) => {
      if (!user) return;
      if (!isFirebaseConfigured) {
        const demoUser = makeDemoUser(updates.displayName, user.email ?? "demo@student.local");
        window.localStorage.setItem(
          demoAuthKey,
          JSON.stringify({ displayName: demoUser.displayName, email: demoUser.email }),
        );
        setUser(demoUser);
        setProfile({
          ...makeDemoProfile(demoUser),
          onboardingCompleted: true,
        });
        setPreferences({
          preferredStudyStartHour: updates.preferredStudyStartHour,
          preferredStudyEndHour: updates.preferredStudyEndHour,
          preferredSessionMinutes: updates.preferredSessionMinutes,
          burnoutSensitivity: updates.burnoutSensitivity,
          maxDailyStudyMinutes: updates.maxDailyStudyMinutes,
          updatedAt: Timestamp.now(),
        });
        return;
      }

      await Promise.all([
        setDoc(
          userDoc(user.uid),
          {
            displayName: updates.displayName,
            onboardingCompleted: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        ),
        setDoc(
          preferencesDoc(user.uid),
          {
            preferredStudyStartHour: updates.preferredStudyStartHour,
            preferredStudyEndHour: updates.preferredStudyEndHour,
            preferredSessionMinutes: updates.preferredSessionMinutes,
            burnoutSensitivity: updates.burnoutSensitivity,
            maxDailyStudyMinutes: updates.maxDailyStudyMinutes,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        ),
      ]);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      preferences,
      loading,
      signUp,
      logIn,
      logOut,
      completeOnboarding,
    }),
    [completeOnboarding, loading, logIn, logOut, preferences, profile, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
