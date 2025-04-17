
// Format a number to Indian currency format (e.g., 10,00,000.00)
export const formatToIndianCurrency = (amount: number): string => {
  // Convert to fixed 2 decimal places
  const fixedAmount = amount.toFixed(2);
  
  // Split the number by decimal point
  const [wholePart, decimalPart] = fixedAmount.split('.');
  
  // Format the whole part with Indian number formatting (e.g., x,xx,xxx)
  let formattedWholePart = '';
  const wholePartStr = wholePart;
  
  if (wholePartStr.length <= 3) {
    formattedWholePart = wholePartStr;
  } else {
    // First add the last 3 digits
    formattedWholePart = wholePartStr.substring(wholePartStr.length - 3);
    
    // Then add the rest in groups of 2 from right to left
    for (let i = wholePartStr.length - 3; i > 0; i -= 2) {
      formattedWholePart = 
        (i === 1 ? wholePartStr.substring(0, 1) : wholePartStr.substring(i - 2, i)) + 
        ',' + 
        formattedWholePart;
    }
  }
  
  // Return the formatted string with the rupee symbol
  return `₹${formattedWholePart}.${decimalPart}`;
};

// Parse an Indian currency format back to a number
export const parseIndianCurrency = (formattedAmount: string): number => {
  // Remove rupee symbol and commas, then parse as float
  return parseFloat(formattedAmount.replace(/[₹,]/g, ''));
};

// Calculate the final amount based on principal, rate, and time
export const calculateFinalAmount = (
  principal: number,
  ratePercent: number,
  timeYears: number
): number => {
  const rate = ratePercent / 100;
  return principal * Math.pow(1 + rate, timeYears);
};

// Calculate the amount to add per second to reach the final amount in given time
export const calculateAmountPerSecond = (
  initialAmount: number,
  finalAmount: number,
  timeYears: number
): number => {
  const totalSeconds = timeYears * 365 * 24 * 60 * 60; // Convert years to seconds
  return (finalAmount - initialAmount) / totalSeconds;
};

// Calculate the time elapsed percentage
export const calculateTimeElapsedPercentage = (
  startTimestamp: number, 
  totalSeconds: number
): number => {
  const currentTime = Date.now();
  const elapsedSeconds = (currentTime - startTimestamp) / 1000;
  return Math.min((elapsedSeconds / totalSeconds) * 100, 100);
};

// Format seconds to time display (days, hours, minutes, seconds)
export const formatTimeElapsed = (seconds: number): string => {
  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * 24 * 60 * 60;
  
  const hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * 60 * 60;
  
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  
  seconds = Math.floor(seconds);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
  result += `${seconds}s`;
  
  return result;
};

// Generate data points for the chart based on the growth model
export const generateChartData = (
  initialAmount: number,
  finalAmount: number,
  timeYears: number,
  currentAmount: number,
  dataPoints: number = 12
): { label: string; value: number }[] => {
  const data = [];
  const totalMonths = timeYears * 12;
  const monthlyGrowthRate = Math.pow(finalAmount / initialAmount, 1 / totalMonths) - 1;
  
  // Add starting point
  data.push({ label: 'Start', value: initialAmount });
  
  // Add current point if we've started
  if (currentAmount > initialAmount) {
    const percentComplete = (currentAmount - initialAmount) / (finalAmount - initialAmount);
    const currentMonth = Math.floor(percentComplete * totalMonths);
    if (currentMonth > 0) {
      data.push({ 
        label: `Month ${currentMonth}`, 
        value: currentAmount 
      });
    }
  }
  
  // Add prediction points
  for (let i = 1; i <= dataPoints; i++) {
    const month = Math.floor((i * totalMonths) / dataPoints);
    const predictedValue = initialAmount * Math.pow(1 + monthlyGrowthRate, month);
    data.push({
      label: `Month ${month}`,
      value: predictedValue
    });
  }
  
  // Add final point if not already included
  if (totalMonths % dataPoints !== 0) {
    data.push({
      label: `Month ${totalMonths}`,
      value: finalAmount
    });
  }
  
  return data;
};

// Format a date for the table
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Calculate projection data for the table - yearly intervals
export const calculateProjectionData = (
  initialAmount: number,
  finalAmount: number,
  timeYears: number
): Array<{ date: string; amount: number; growth: number }> => {
  const data = [];
  const currentDate = new Date();
  const msPerYear = 365 * 24 * 60 * 60 * 1000;
  
  // Calculate compound annual growth rate
  const cagr = Math.pow(finalAmount / initialAmount, 1 / timeYears) - 1;
  
  // Add initial entry
  data.push({
    date: formatDate(currentDate),
    amount: initialAmount,
    growth: 0
  });
  
  // Add yearly entries
  for (let year = 1; year <= timeYears; year++) {
    const futureDate = new Date(currentDate.getTime() + year * msPerYear);
    const projectedAmount = initialAmount * Math.pow(1 + cagr, year);
    const previousAmount = initialAmount * Math.pow(1 + cagr, year - 1);
    const yearlyGrowth = (projectedAmount / previousAmount - 1) * 100;
    
    data.push({
      date: formatDate(futureDate),
      amount: projectedAmount,
      growth: yearlyGrowth
    });
  }
  
  return data;
};
