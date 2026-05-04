import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

const tableNames = {
  Profile: "profiles",
  ConversationRequest: "conversation_requests",
  Conversation: "conversations",
  Message: "messages",
  Block: "blocks",
  Report: "reports",
};

const applyFilters = (query, filters = {}) => {
  return Object.entries(filters).reduce((q, [key, value]) => q.eq(key, value), query);
};

const createEntityApi = (entityName) => {
  const table = tableNames[entityName];

  return {
    async filter(filters = {}, orderBy) {
      let query = applyFilters(supabase.from(table).select("*"), filters);
      if (orderBy) {
        const ascending = !orderBy.startsWith("-");
        query = query.order(orderBy.replace(/^-/, ""), { ascending });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async list(orderBy = "-created_at", limit = 100) {
      const ascending = !orderBy.startsWith("-");
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(orderBy.replace(/^-/, ""), { ascending })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },

    async create(payload) {
      const { data, error } = await supabase.from(table).insert(payload).select("*").single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase.from(table).update(payload).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
  };
};

export const appClient = {
  auth: {
    async me() {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!data.user) throw new Error("User not authenticated");
      return {
        ...data.user,
        full_name: data.user.user_metadata?.full_name || data.user.email,
        role: data.user.app_metadata?.role,
      };
    },

    async logout(redirectTo = "/") {
      await supabase.auth.signOut();
      if (redirectTo) window.location.href = redirectTo;
    },

    async redirectToLogin(redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`) {
      const email = window.prompt("Digite seu e-mail para receber o link de acesso:");
      if (!email) return;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
    },
  },

  entities: {
    Profile: createEntityApi("Profile"),
    ConversationRequest: createEntityApi("ConversationRequest"),
    Conversation: createEntityApi("Conversation"),
    Message: createEntityApi("Message"),
    Block: createEntityApi("Block"),
    Report: createEntityApi("Report"),
  },

  integrations: {
    Core: {
      async UploadFile({ file, bucket = "profile-photos" }) {
        const path = `${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return { file_url: data.publicUrl };
      },
    },
  },
};
