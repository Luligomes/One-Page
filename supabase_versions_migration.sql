-- Execute uma única vez no SQL Editor do mesmo projeto Supabase usado pela Vercel.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.versoes_contrato (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato TEXT NOT NULL,
    nome TEXT NOT NULL,
    periodo TEXT,
    dados JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_versoes_contrato_data
    ON public.versoes_contrato (contrato, created_at DESC);

ALTER TABLE public.versoes_contrato ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'versoes_contrato'
          AND policyname = 'Leitura global de versões'
    ) THEN
        CREATE POLICY "Leitura global de versões"
            ON public.versoes_contrato FOR SELECT
            TO anon, authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'versoes_contrato'
          AND policyname = 'Criação global de versões'
    ) THEN
        CREATE POLICY "Criação global de versões"
            ON public.versoes_contrato FOR INSERT
            TO anon, authenticated
            WITH CHECK (true);
    END IF;
END
$$;

GRANT SELECT, INSERT ON public.versoes_contrato TO anon, authenticated;
