import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xusjcbqzicenyhkjfvym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1c2pjYnF6aWNlbnloa2pmdnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNjEzMzcsImV4cCI6MjA3MTgzNzMzN30.h0dhP3eVgYZDD60tZAX1DdNdwA4xW5aPfc8Rfk7HasQ";

export const supabase = createClient(supabaseUrl, supabaseKey);
