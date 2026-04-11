class AddQuoteSequenceFunction < ActiveRecord::Migration[8.0]
  # Adds a PostgreSQL function that atomically generates the next sequence number
  # for a given year prefix. Replaces the pg_advisory_lock approach in Quote model
  # which was prone to connection-drop deadlocks and hash collisions.
  #
  # Usage in Ruby:
  #   seq = ActiveRecord::Base.connection.select_value("SELECT next_quote_seq(#{year})")
  def up
    execute <<~SQL
      CREATE OR REPLACE FUNCTION next_quote_seq(p_year INT)
      RETURNS INT
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_seq INT;
      BEGIN
        SELECT COALESCE(MAX(
          CAST(SPLIT_PART(reference_no, '-', 3) AS INT)
        ), 0) + 1
        INTO v_seq
        FROM quotes
        WHERE reference_no LIKE 'SQ-' || p_year || '-%'
          AND reference_no ~ '^SQ-[0-9]{4}-[0-9]+$'
        FOR UPDATE;

        RETURN v_seq;
      END;
      $$;
    SQL
  end

  def down
    execute "DROP FUNCTION IF EXISTS next_quote_seq(INT);"
  end
end
