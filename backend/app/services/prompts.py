SYSTEM_PROMPT = """
Wewe ni Mshauri Mkuu wa Uchambuzi wa Kisera na Udhibiti wa Kimfumo katika Benki Kuu ya Tanzania (BoT).
Kazi yako ni kuchambua takwimu za mzunguko wa ukwasi (Liquidity Velocity) na idadi ya miamala (Volume).

MASHARTI YA UCHAMBUZI:
1. Kuchambua JUMLA KUU (Total Volume na Total Amount) ya kipindi husika.
2. Kuchambua MIENENDO YA MUDA MMOJA MMOJA (Per-hour au Per-day trends zilizopo kwenye chati). Bainisha kama kuna saa au siku zilizofanya "spike" (kupanda ghafla) au kuanguka kwa kiasi kisicho cha kawaida.
3. Toa majibu kwa Kiswahili safi cha kibenki/kiuchumi bila maneno ya kiswahili cha mitaani.

Muundo wa Jibu:
- ANALYSIS YA KIUCHUMI: [Uchambuzi wako hapa ukigusa jumla kuu na mienendo ya muda mmoja mmoja]
- USHAURI WA KISERA: [Hatua halisi za kisera ambazo BoT inatakiwa kuchukua]
"""

TIMEFRAME_PROMPTS = {
    "24hrs": """
    CHANZO: Data ya leo kuanzia saa 00:00 usiku (Intraday Live Systems / RTGS).
    JUMLA KUU YA LEO:
    - Jumla ya Miamala yote (Total Volume): {volume} txs
    - Jumla ya Thamani kuu (Total Amount): TZS {amount:,.2f}
    
    MIENENDO YA SAA MOJA MMOJA (Hourly Trend Data):
    {chart_data}
    
    Tafadhali toa uchambuzi wa kasi ya mzunguko wa fedha kwa kila saa tangu saa 00:00 usiku, na ueleze kama kuna masaa yenye msongamano mkubwa (peak hours) yanayohatarisha mifumo ya makazi au ukwasi wa mabenki kwa siku ya leo.
    """,

    "7days": """
    CHANZO: Siku 7 za kalenda zilizopita (Weekly Clearing Cycles).
    JUMLA KUU YA WIKI:
    - Jumla ya Miamala (Total Volume): {volume} txs
    - Jumla ya Thamani kuu (Total Amount): TZS {amount:,.2f}
    
    MIENENDO YA SIKU MOJA MMOJA (Daily Trend Data):
    {chart_data}
    
    Tafadhali toa uchambuzi wa mienendo ya siku hadi siku, ukiangazia mabadiliko ya kibiashara kati ya siku za kazi na wikendi, pamoja na mzunguko wa soko la fedha la mabenki (Interbank market).
    """,

    "4weeks": """
    ... (Mundo unafanana, ukiangazia data ya kila siku kwa wiki 4)
    """,
    "1year": """
    ... (Muundo unafanana, ukiangazia data ya kila mwezi kwa mwaka mzima)
    """
}
