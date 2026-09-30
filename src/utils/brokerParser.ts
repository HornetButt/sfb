import { BrokerImportRow, Currency, TransactionType } from '../types';

export const SAMPLE_TINKOFF_REPORT = `Дата заключения;Код инструмента;Вид сделки;Количество;Цена;Валюта цены;Комиссия брокера;Валюта комиссии
2024-08-10;O;Покупка;15;52.40;USD;0.45;USD
2024-08-15;SCHD;Покупка;20;78.10;USD;0.50;USD
2024-09-02;KO;Покупка;25;64.20;USD;0.40;USD
2024-09-12;MAIN;Покупка;15;48.50;USD;0.30;USD
2024-09-20;O;Покупка;10;53.80;USD;0.30;USD`;

export const SAMPLE_IBKR_REPORT = `Date/Time,Symbol,Buy/Sell,Quantity,Price,Fee,Currency
2024-07-15,AAPL,BUY,10,210.50,1.00,USD
2024-08-01,MSFT,BUY,5,415.20,1.00,USD
2024-08-20,NVDA,BUY,20,118.40,1.00,USD
2024-09-05,AAPL,SELL,3,228.00,1.00,USD`;

export const SAMPLE_SBER_REPORT = `Дата сделки;Код инструмента;Операция;Количество;Цена сделки;Комиссия;Валюта
2024-05-14;SBER;Купля;300;255.00;15.30;RUB
2024-06-18;LKOH;Купля;10;6650.00;20.00;RUB
2024-07-22;TATN;Купля;80;560.00;12.50;RUB
2024-08-05;ROSN;Купля;50;475.00;10.00;RUB`;

export const SAMPLE_UNIVERSAL_CSV = `Date,Ticker,Type,Shares,Price,Fee,Currency,Notes
2024-09-01,O,BUY,25,53.20,0.50,USD,Универсальный импорт
2024-09-05,SCHD,BUY,15,79.50,0.50,USD,
2024-09-10,KO,BUY,30,65.10,0.50,USD,Стабильные дивиденды`;

export function parseBrokerReport(text: string, defaultCurrency: Currency = 'USD'): BrokerImportRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

  // Normalize header
  const headerParts = firstLine.split(delimiter).map(p => p.trim().toLowerCase().replace(/["']/g, ''));

  // Find column indices
  let dateIdx = -1;
  let tickerIdx = -1;
  let typeIdx = -1;
  let sharesIdx = -1;
  let priceIdx = -1;
  let feeIdx = -1;
  let currencyIdx = -1;
  let notesIdx = -1;

  for (let i = 0; i < headerParts.length; i++) {
    const col = headerParts[i];
    if (col.includes('date') || col.includes('дата')) dateIdx = i;
    else if (col.includes('ticker') || col.includes('тикер') || col.includes('код') || col.includes('symbol') || col.includes('инструмент')) tickerIdx = i;
    else if (col.includes('type') || col.includes('тип') || col.includes('вид') || col.includes('операция') || col.includes('buy/sell') || col.includes('направление')) typeIdx = i;
    else if (col.includes('shares') || col.includes('quantity') || col.includes('кол-во') || col.includes('количество') || col.includes('кол')) sharesIdx = i;
    else if (col.includes('price') || col.includes('цена')) priceIdx = i;
    else if (col.includes('fee') || col.includes('комиссия') || col.includes('comm')) feeIdx = i;
    else if (col.includes('curr') || col.includes('валюта')) currencyIdx = i;
    else if (col.includes('note') || col.includes('примеч') || col.includes('коммент')) notesIdx = i;
  }

  // Fallbacks if header wasn't recognized by name
  if (dateIdx === -1 && headerParts.length >= 5) dateIdx = 0;
  if (tickerIdx === -1 && headerParts.length >= 5) tickerIdx = 1;
  if (typeIdx === -1 && headerParts.length >= 5) typeIdx = 2;
  if (sharesIdx === -1 && headerParts.length >= 5) sharesIdx = 3;
  if (priceIdx === -1 && headerParts.length >= 5) priceIdx = 4;
  if (feeIdx === -1 && headerParts.length >= 6) feeIdx = 5;

  const rows: BrokerImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const rawParts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (rawParts.length < 3) continue;

    // Parse date
    let rawDate = rawParts[dateIdx] || '';
    // Format YYYY-MM-DD or DD.MM.YYYY
    let parsedDate = rawDate;
    if (rawDate.includes('.')) {
      const dp = rawDate.split(' ')[0].split('.');
      if (dp.length === 3) {
        parsedDate = `${dp[2]}-${dp[1].padStart(2, '0')}-${dp[0].padStart(2, '0')}`;
      }
    } else if (rawDate.includes('/')) {
      const dp = rawDate.split(' ')[0].split('/');
      if (dp.length === 3) {
        // Assume YYYY/MM/DD or MM/DD/YYYY
        if (dp[0].length === 4) {
          parsedDate = `${dp[0]}-${dp[1].padStart(2, '0')}-${dp[2].padStart(2, '0')}`;
        } else {
          parsedDate = `${dp[2]}-${dp[0].padStart(2, '0')}-${dp[1].padStart(2, '0')}`;
        }
      }
    } else {
      parsedDate = rawDate.split('T')[0].split(' ')[0];
    }

    if (!parsedDate || parsedDate.length < 8) {
      parsedDate = new Date().toISOString().split('T')[0];
    }

    // Parse ticker
    const ticker = (rawParts[tickerIdx] || '').toUpperCase().trim();

    // Parse type
    const rawType = (rawParts[typeIdx] || '').toLowerCase();
    let type: TransactionType = 'BUY';
    if (rawType.includes('sell') || rawType.includes('продаж') || rawType.includes('продажа') || rawType.includes('сбыт')) {
      type = 'SELL';
    } else if (rawType.includes('div') || rawType.includes('дивиденд') || rawType.includes('купон')) {
      type = 'DIVIDEND';
    }

    // Parse shares
    const rawShares = (rawParts[sharesIdx] || '').replace(',', '.').replace(/\s/g, '');
    const shares = Math.abs(parseFloat(rawShares) || 0);

    // Parse price
    const rawPrice = (rawParts[priceIdx] || '').replace(',', '.').replace(/\s/g, '');
    const price = Math.abs(parseFloat(rawPrice) || 0);

    // Parse fee
    let fee = 0;
    if (feeIdx !== -1 && rawParts[feeIdx]) {
      const rawFee = rawParts[feeIdx].replace(',', '.').replace(/\s/g, '');
      fee = Math.abs(parseFloat(rawFee) || 0);
    }

    // Parse currency
    let currency = defaultCurrency;
    if (currencyIdx !== -1 && rawParts[currencyIdx]) {
      const cur = rawParts[currencyIdx].toUpperCase();
      if (cur.includes('RUB') || cur.includes('РУБ')) currency = 'RUB';
      else if (cur.includes('EUR') || cur.includes('ЕВР')) currency = 'EUR';
      else if (cur.includes('CNY') || cur.includes('ЮАН')) currency = 'CNY';
      else if (cur.includes('USD') || cur.includes('ДОЛЛ')) currency = 'USD';
    }

    const notes = notesIdx !== -1 ? rawParts[notesIdx] : '';

    const valid = !!(ticker && shares > 0 && price > 0);
    const errorMessage = !ticker
      ? 'Не указан тикер'
      : shares <= 0
      ? 'Количество должно быть > 0'
      : price <= 0
      ? 'Цена должна быть > 0'
      : undefined;

    rows.push({
      date: parsedDate,
      ticker,
      type,
      shares,
      price,
      fee,
      currency,
      notes,
      valid,
      errorMessage
    });
  }

  return rows;
}
