import "../resources/style/timelineSelector.scss";
export default function TimelineSelector() {
  return (
    <>
      <div id="form-wrapper">
        <form>
          <div id="debt-amount-slider">
            <input type="radio" name="debt-amount" id="1" value="1" required />
            <label htmlFor="1" data-debt-amount="< $10k"></label>
            <input type="radio" name="debt-amount" id="2" value="2" required />
            <label htmlFor="2" data-debt-amount="$10k-25k"></label>
            <input type="radio" name="debt-amount" id="3" value="3" required />
            <label htmlFor="3" data-debt-amount="$25k-50k"></label>
            <input type="radio" name="debt-amount" id="4" value="4" required />
            <label htmlFor="4" data-debt-amount="$50k-100k"></label>
            <input type="radio" name="debt-amount" id="5" value="5" required />
            <label htmlFor="5" data-debt-amount="$100k+"></label>
            <div id="debt-amount-pos"></div>
          </div>
        </form>
      </div>
    </>
  );
}
