import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { FinancesContent } from "@/components/finances/FinancesContent";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export const dynamic = "force-dynamic";

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string; year?: string }>;
}) {
  const { tab, month, year } = await searchParams;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/onboarding");
  const orgId = profile.organization_id;

  const now = new Date();
  const targetDate = new Date(
    parseInt(year || String(now.getFullYear())),
    parseInt(month || String(now.getMonth()))
  );

  const monthStart = format(startOfMonth(targetDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(targetDate), "yyyy-MM-dd");

  // Build 12-month chart data (revenue + expenses per month)
  const chartMonths = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    return { start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd"), label: format(d, "MMM yy") };
  });

  const [
    { data: paymentsThisMonth },
    { data: expensesThisMonth },
    { data: allPayments },
    { data: allExpenses },
    { data: reservationsWithBalance },
  ] = await Promise.all([
    supabase.from("payments")
      .select("amount, method, type, payment_date, reference, reservation_id")
      .eq("organization_id", orgId)
      .gte("payment_date", monthStart)
      .lte("payment_date", monthEnd + "T23:59:59")
      .order("payment_date", { ascending: false }),
    supabase.from("expenses")
      .select("*")
      .eq("organization_id", orgId)
      .gte("expense_date", monthStart)
      .lte("expense_date", monthEnd)
      .order("expense_date", { ascending: false }),
    supabase.from("payments")
      .select("id, amount, method, type, payment_date, reference, notes, reservation_id, guest_id, currency")
      .eq("organization_id", orgId)
      .order("payment_date", { ascending: false })
      .limit(100),
    supabase.from("expenses")
      .select("*")
      .eq("organization_id", orgId)
      .order("expense_date", { ascending: false })
      .limit(100),
    supabase.from("reservations")
      .select("id, confirmation_code, balance_due, total_amount, amount_paid, check_in_date, check_out_date, guest:guests(first_name, last_name)")
      .eq("organization_id", orgId)
      .gt("balance_due", 0)
      .in("status", ["confirmed", "checked_in", "checked_out"])
      .order("check_in_date", { ascending: false })
      .limit(20),
  ]);

  // Build chart data
  const chartData = await Promise.all(
    chartMonths.map(async ({ start, end, label }) => {
      const [{ data: rev }, { data: exp }] = await Promise.all([
        supabase.from("payments").select("amount").eq("organization_id", orgId)
          .gte("payment_date", start).lte("payment_date", end + "T23:59:59"),
        supabase.from("expenses").select("amount").eq("organization_id", orgId)
          .gte("expense_date", start).lte("expense_date", end),
      ]);
      const revenue = (rev || []).reduce((s, p) => s + (p.amount || 0), 0);
      const expenses = (exp || []).reduce((s, e) => s + (e.amount || 0), 0);
      return { label, revenue, expenses, profit: revenue - expenses };
    })
  );

  const totalRevenue = (paymentsThisMonth || []).reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = (expensesThisMonth || []).reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Fetch reservation info for payments list
  const reservationIdsSet = new Set((allPayments || []).filter(p => p.reservation_id).map(p => p.reservation_id as string));
  const reservationIds = Array.from(reservationIdsSet);
  const reservationMap: Record<string, { confirmation_code: string; guest?: { first_name: string; last_name: string } }> = {};
  if (reservationIds.length > 0) {
    const { data: resData } = await supabase.from("reservations")
      .select("id, confirmation_code, guest:guests(first_name, last_name)")
      .in("id", reservationIds);
    (resData || []).forEach((r) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reservationMap[r.id] = r as any;
    });
  }

  return (
    <>
      <TopBar title="Finances" />
      <main className="p-4 lg:p-6">
        <FinancesContent
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payments={(allPayments || []) as any[]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expenses={(allExpenses || []) as any[]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reservationsWithBalance={(reservationsWithBalance || []) as any[]}
          chartData={chartData}
          totalRevenue={totalRevenue}
          totalExpenses={totalExpenses}
          netProfit={netProfit}
          currentMonth={targetDate.getMonth()}
          currentYear={targetDate.getFullYear()}
          activeTab={tab || "overview"}
          reservationMap={reservationMap}
        />
      </main>
    </>
  );
}
