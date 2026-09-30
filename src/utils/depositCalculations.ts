import { BankDeposit, DepositPayoutFrequency, DepositRateChange } from '../types';

export interface ProjectedDepositPayout {
  date: string; // YYYY-MM-DD
  amount: number;
  rateApplied: number;
  balanceBefore: number;
  balanceAfter: number;
  isEndOfTerm?: boolean;
}

/**
 * Finds the effective interest rate for a deposit on a given date
 */
export function getEffectiveRate(deposit: BankDeposit, targetDate: string): number {
  if (!deposit.rateHistory || deposit.rateHistory.length === 0) {
    return deposit.interestRate;
  }

  // Sort rate history ascending
  const sorted = [...deposit.rateHistory].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  let currentRate = deposit.interestRate;

  for (const item of sorted) {
    if (item.effectiveDate <= targetDate) {
      currentRate = item.rate;
    }
  }

  return currentRate;
}

/**
 * Generates the future payments schedule for a deposit
 */
export function generateFuturePaymentSchedule(deposit: BankDeposit, maxCount: number = 12): ProjectedDepositPayout[] {
  const schedule: ProjectedDepositPayout[] = [];
  const now = new Date();
  let simBalance = deposit.currentBalance;

  const startDate = new Date(deposit.startDate);
  const endDate = deposit.endDate ? new Date(deposit.endDate) : null;

  if (deposit.payoutFrequency === 'end_of_term') {
    const termEnd = endDate || new Date(startDate.getTime() + 365 * 24 * 3600 * 1000);
    const dateStr = termEnd.toISOString().split('T')[0];
    const rate = getEffectiveRate(deposit, dateStr);
    
    // Days between start and end
    const totalDays = Math.max(1, Math.round((termEnd.getTime() - startDate.getTime()) / (24 * 3600 * 1000)));
    const payoutAmount = simBalance * (rate / 100) * (totalDays / 365);

    schedule.push({
      date: dateStr,
      amount: payoutAmount,
      rateApplied: rate,
      balanceBefore: simBalance,
      balanceAfter: deposit.isCapitalized ? simBalance + payoutAmount : simBalance,
      isEndOfTerm: true
    });

    return schedule;
  }

  if (deposit.payoutFrequency === 'daily') {
    // Generate next 30 days
    const daysToShow = Math.min(maxCount * 3, 30);
    for (let i = 1; i <= daysToShow; i++) {
      const pDate = new Date(now.getTime() + i * 24 * 3600 * 1000);
      if (endDate && pDate > endDate) break;

      const dateStr = pDate.toISOString().split('T')[0];
      const rate = getEffectiveRate(deposit, dateStr);
      const dailyInterest = (simBalance * (rate / 100)) / 365;

      const balanceAfter = deposit.isCapitalized ? simBalance + dailyInterest : simBalance;
      schedule.push({
        date: dateStr,
        amount: dailyInterest,
        rateApplied: rate,
        balanceBefore: simBalance,
        balanceAfter: balanceAfter
      });

      if (deposit.isCapitalized) {
        simBalance = balanceAfter;
      }
    }

    return schedule;
  }

  // Monthly / Quarterly / Annual
  const stepMonths = deposit.payoutFrequency === 'annual' ? 12 : deposit.payoutFrequency === 'quarterly' ? 3 : 1;
  const targetDay = startDate.getDate();

  let currentDate = new Date(now.getFullYear(), now.getMonth(), targetDay);
  if (currentDate <= now) {
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  for (let i = 0; i < maxCount; i++) {
    if (endDate && currentDate > endDate) {
      break;
    }

    const dateStr = currentDate.toISOString().split('T')[0];
    const rate = getEffectiveRate(deposit, dateStr);
    const fractionOfYear = stepMonths / 12;
    const payoutAmount = simBalance * (rate / 100) * fractionOfYear;

    const balanceAfter = deposit.isCapitalized ? simBalance + payoutAmount : simBalance;

    schedule.push({
      date: dateStr,
      amount: payoutAmount,
      rateApplied: rate,
      balanceBefore: simBalance,
      balanceAfter: balanceAfter
    });

    if (deposit.isCapitalized) {
      simBalance = balanceAfter;
    }

    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + stepMonths, targetDay);
  }

  return schedule;
}

export const FREQUENCY_LABELS: Record<DepositPayoutFrequency, string> = {
  daily: 'Каждый день',
  monthly: 'Раз в месяц',
  quarterly: 'Раз в квартал',
  annual: 'Раз в год',
  end_of_term: 'В конце срока'
};
