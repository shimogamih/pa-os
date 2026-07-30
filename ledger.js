// ledger.js — Portfolio Ledger architecture
// Provides a lightweight in-browser ledger service for portfolio holdings.
// - Models: PortfolioHolding, PortfolioLedger
// - Service functions: createLedger, loadLedger, saveLedger, updateLedger
// Persistence: localStorage under key "paos_portfolio_ledger" (JSON)

(function(){
  // Utils
  function nowISO(){ return new Date().toISOString(); }
  function generateId(){ if(typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); return 'id-' + Math.random().toString(36).slice(2,11); }

  // Models
  class PortfolioHolding {
    constructor({ id, ticker, company, estimatedShares, estimatedAveragePrice, currentPrice, currentValue, unrealizedProfit, sector, assetType, lastUpdated } = {}){
      this.id = id || generateId();
      this.ticker = ticker || '';
      this.company = company || '';
      this.estimatedShares = Number(estimatedShares) || 0;
      this.estimatedAveragePrice = Number(estimatedAveragePrice) || 0;
      this.currentPrice = Number(currentPrice) || 0;
      this.currentValue = Number(currentValue) || (this.estimatedShares * this.currentPrice) || 0;
      this.unrealizedProfit = Number(unrealizedProfit) || (this.currentValue - (this.estimatedShares * this.estimatedAveragePrice)) || 0;
      this.sector = sector || '';
      this.assetType = assetType || '';
      this.lastUpdated = lastUpdated || nowISO();
    }

    update(fields = {}){
      Object.keys(fields).forEach(k => {
        if(k in this){
          this[k] = fields[k];
        }
      });
      // Recalculate derived values if prices/shares changed
      this.estimatedShares = Number(this.estimatedShares) || 0;
      this.estimatedAveragePrice = Number(this.estimatedAveragePrice) || 0;
      this.currentPrice = Number(this.currentPrice) || 0;
      this.currentValue = Number(this.currentValue) || (this.estimatedShares * this.currentPrice) || 0;
      this.unrealizedProfit = Number(this.unrealizedProfit) || (this.currentValue - (this.estimatedShares * this.estimatedAveragePrice)) || 0;
      this.lastUpdated = nowISO();
    }
  }

  class PortfolioLedger {
    constructor({ version, broker, createdAt, updatedAt, holdings } = {}){
      this.version = version || 1;
      this.broker = broker || 'auto';
      this.createdAt = createdAt || nowISO();
      this.updatedAt = updatedAt || nowISO();
      this.holdings = Array.isArray(holdings) ? holdings.map(h => (h instanceof PortfolioHolding ? h : new PortfolioHolding(h))) : [];
    }

    toJSON(){
      return {
        version: this.version,
        broker: this.broker,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        holdings: this.holdings.map(h => ({
          id: h.id,
          ticker: h.ticker,
          company: h.company,
          estimatedShares: h.estimatedShares,
          estimatedAveragePrice: h.estimatedAveragePrice,
          currentPrice: h.currentPrice,
          currentValue: h.currentValue,
          unrealizedProfit: h.unrealizedProfit,
          sector: h.sector,
          assetType: h.assetType,
          lastUpdated: h.lastUpdated
        }))
      };
    }

    addHolding(h){
      const holding = h instanceof PortfolioHolding ? h : new PortfolioHolding(h);
      this.holdings.push(holding);
      this.updatedAt = nowISO();
      return holding;
    }

    updateHolding(id, fields){
      const idx = this.holdings.findIndex(h => h.id === id);
      if(idx === -1) return null;
      this.holdings[idx].update(fields);
      this.updatedAt = nowISO();
      return this.holdings[idx];
    }

    removeHolding(id){
      const before = this.holdings.length;
      this.holdings = this.holdings.filter(h => h.id !== id);
      if(this.holdings.length !== before){ this.updatedAt = nowISO(); return true; }
      return false;
    }
  }

  // Persistence
  const STORAGE_KEY = 'paos_portfolio_ledger';

  async function saveLedger(ledger){
    if(!(ledger instanceof PortfolioLedger)){
      throw new Error('ledger must be a PortfolioLedger instance');
    }
    try{
      ledger.updatedAt = nowISO();
      const payload = JSON.stringify(ledger.toJSON());
      localStorage.setItem(STORAGE_KEY, payload);
      return ledger;
    } catch(e){
      console.error('saveLedger error', e);
      throw e;
    }
  }

  async function loadLedger(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      return new PortfolioLedger(parsed);
    } catch(e){
      console.error('loadLedger error', e);
      return null;
    }
  }

  async function createLedger({ broker = 'auto', version = 1 } = {}){
    const ledger = new PortfolioLedger({ version, broker, createdAt: nowISO(), updatedAt: nowISO(), holdings: [] });
    await saveLedger(ledger);
    return ledger;
  }

  async function updateLedger(updater){
    // updater can be a function(ledger) or a partial object to merge
    const ledger = await loadLedger();
    if(!ledger) throw new Error('No ledger found to update');
    if(typeof updater === 'function'){
      await Promise.resolve(updater(ledger));
    } else if(typeof updater === 'object'){
      // shallow merge supported fields: broker, version
      if('broker' in updater) ledger.broker = updater.broker;
      if('version' in updater) ledger.version = updater.version;
      if('holdings' in updater && Array.isArray(updater.holdings)){
        // replace holdings fully
        ledger.holdings = updater.holdings.map(h => (h instanceof PortfolioHolding ? h : new PortfolioHolding(h)));
      }
    }
    ledger.updatedAt = nowISO();
    await saveLedger(ledger);
    return ledger;
  }

  // Expose API
  window.PAOS = window.PAOS || {};
  window.PAOS.Ledger = {
    PortfolioHolding,
    PortfolioLedger,
    createLedger,
    loadLedger,
    saveLedger,
    updateLedger,
    STORAGE_KEY
  };

})();
