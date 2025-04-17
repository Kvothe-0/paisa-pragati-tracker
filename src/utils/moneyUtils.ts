
// Format a number to Indian currency format (e.g., 10,00,000.00)
export const formatToIndianCurrency = (amount: number): string => {
  // Convert to fixed 2 decimal places
  const fixedAmount = amount.toFixed(2);
  
  // Split the number by decimal point
  const [wholePart, decimalPart] = fixedAmount.split('.');
  
  // Format the whole part with Indian number formatting (e.g., x,xx,xxx)
  let formattedWholePart = '';
  const wholePartStr = wholePart;
  
  // Handle first part (up to last 3 digits)
  const firstPartEndIndex = wholePartStr.length % 2 === 1 ? 1 : 2;
  
  if (wholePartStr.length <= 3) {
    formattedWholePart = wholePartStr;
  } else {
    // Add the first chunk (could be 1 or 2 digits)
    if (firstPartEndIndex > 0) {
      formattedWholePart = wholePartStr.substring(0, firstPartEndIndex);
    }
    
    // Add remaining chunks in pairs (for Indian format)
    for (let i = firstPartEndIndex; i < wholePartStr.length; i += 2) {
      if (i > 0) formattedWholePart += ',';
      formattedWholePart += wholePartStr.substring(i, Math.min(i + 2, wholePartStr.length));
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

// Calculate projection data for the table
export const calculateProjectionData = (
  initialAmount: number,
  finalAmount: number,
  timeYears: number,
  dataPoints: number = 5
): Array<{ date: string; amount: number; growth: number }> => {
  const data = [];
  const currentDate = new Date();
  const msPerYear = 365 * 24 * 60 * 60 * 1000;
  
  // Calculate compound growth rate
  const rate = Math.pow(finalAmount / initialAmount, 1 / timeYears) - 1;
  
  for (let i = 0; i <= dataPoints; i++) {
    const yearFraction = i * (timeYears / dataPoints);
    const futureDate = new Date(currentDate.getTime() + yearFraction * msPerYear);
    const projectedAmount = initialAmount * Math.pow(1 + rate, yearFraction);
    const growth = i === 0 ? 0 : (projectedAmount / data[i-1].amount - 1) * 100;
    
    data.push({
      date: formatDate(futureDate),
      amount: projectedAmount,
      growth: growth
    });
  }
  
  return data;
};
