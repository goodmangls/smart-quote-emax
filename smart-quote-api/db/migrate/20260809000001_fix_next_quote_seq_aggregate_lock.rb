# frozen_string_literal: true

class FixNextQuoteSeqAggregateLock < ActiveRecord::Migration[8.0]
  # 20260411000001 이 만든 next_quote_seq 는 집계 함수 MAX() 에 FOR UPDATE 를 걸어
  # PostgreSQL 이 거부한다 — "FOR UPDATE is not allowed with aggregate functions".
  # 함수가 존재하더라도 호출하면 항상 예외가 나므로 채번이 한 번도 동작한 적이 없다.
  #
  # Quote#generate_reference_no 의 rescue 폴백도 이 상황을 구제하지 못한다.
  # 에러가 트랜잭션 안에서 발생하면 그 트랜잭션은 abort 상태가 되고,
  # rescue 로는 복구되지 않아 이후 모든 문장이 PG::InFailedSqlTransaction 으로 실패한다.
  #
  # 원래 의도(동시 채번 직렬화)는 행 잠금이 아니라 트랜잭션 범위 advisory lock 으로
  # 달성한다. 같은 연도 키에 대해서만 직렬화되고 트랜잭션 종료 시 자동 해제된다.
  def up
    execute <<~SQL
      CREATE OR REPLACE FUNCTION next_quote_seq(p_year INT)
      RETURNS INT
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_seq INT;
      BEGIN
        PERFORM pg_advisory_xact_lock(hashtext('quote_seq_' || p_year));

        SELECT COALESCE(MAX(
          CAST(SPLIT_PART(reference_no, '-', 3) AS INT)
        ), 0) + 1
        INTO v_seq
        FROM quotes
        WHERE reference_no LIKE 'SQ-' || p_year || '-%'
          AND reference_no ~ '^SQ-[0-9]{4}-[0-9]+$';

        RETURN v_seq;
      END;
      $$;
    SQL
  end

  def down
    # 이전 정의는 호출 불가능한 상태였으므로 되돌리지 않고 함수를 제거한다.
    execute "DROP FUNCTION IF EXISTS next_quote_seq(INT);"
  end
end
