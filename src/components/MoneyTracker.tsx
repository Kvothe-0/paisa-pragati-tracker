import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { toast } from 'sonner';
import { 
  formatToIndianCurrency, 
  parseIndianCurrency, 
  calculateFinalAmount, 
  calculateAmountPerSecond,
  calculateTimeElapsedPercentage,
  formatTimeElapsed,
  generateChartData,
  calculateProjectionData
} from '@/utils/moneyUtils';
import { loadState, saveState, MoneyTrackerState } from '@/utils/storageService';
import { PlayCircle, StopCircle, IndianRupee, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import ThemePicker from '@/components/ThemePicker';
import { useIsMobile } from '@/hooks/use-mobile';

const MoneyTracker: React.FC = () => {
  // State
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [timeYears, setTimeYears] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timeElapsedPercentage, setTimeElapsedPercentage] = useState<number>(0);
  const [chartData, setChartData] = useState<Array<{ label: string; value: number }>>([]);
  const [projectionData, setProjectionData] = useState<Array<{ date: string; amount: number; growth: number }>>([]);
  const [amountEarned, setAmountEarned] = useState<number>(0);
  
  // Check if on mobile
  const isMobile = useIsMobile();
  
  // Refs
  const timerRef = useRef<number | null>(null);
  const incrementRef = useRef<number>(0);
  const amountPerSecondRef = useRef<number>(0);
  const finalAmountRef = useRef<number>(0);
  const totalSecondsRef = useRef<number>(0);
  const initialAmountRef = useRef<number>(0);
  
  // Load saved state on component mount
  useEffect(() => {
    const savedState = loadState();
    setInitialAmount(formatToIndianCurrency(savedState.initialAmount));
    setInterestRate(savedState.interestRate.toString());
    setTimeYears(savedState.timeYears.toString());
    setCurrentAmount(savedState.currentAmount);
    setIsRunning(savedState.isRunning);
    setStartTimestamp(savedState.startTimestamp);
    
    // Calculate other values from saved state
    const parsedInitialAmount = savedState.initialAmount;
    const parsedInterestRate = savedState.interestRate;
    const parsedTimeYears = savedState.timeYears;
    
    if (parsedInitialAmount && parsedInterestRate && parsedTimeYears) {
      const calculatedFinalAmount = calculateFinalAmount(
        parsedInitialAmount,
        parsedInterestRate,
        parsedTimeYears
      );
      
      finalAmountRef.current = calculatedFinalAmount;
      
      // Calculate amount per second
      const secondsInYears = parsedTimeYears * 365 * 24 * 60 * 60;
      totalSecondsRef.current = secondsInYears;
      
      const amountPerSecond = calculateAmountPerSecond(
        parsedInitialAmount,
        calculatedFinalAmount,
        parsedTimeYears
      );
      
      amountPerSecondRef.current = amountPerSecond;
      
      // Generate chart data
      const data = generateChartData(
        parsedInitialAmount,
        calculatedFinalAmount,
        parsedTimeYears,
        savedState.currentAmount
      );
      setChartData(data);
      
      // Generate projection data for table with yearly intervals
      const tableData = calculateProjectionData(
        parsedInitialAmount,
        calculatedFinalAmount,
        parsedTimeYears
      );
      setProjectionData(tableData);
    }
    
    // Resume timer if it was running
    if (savedState.isRunning && savedState.startTimestamp) {
      startTimer(
        savedState.initialAmount,
        savedState.interestRate,
        savedState.timeYears,
        savedState.currentAmount,
        savedState.startTimestamp
      );
    }
    
    // Calculate amount earned
    if (savedState.currentAmount > savedState.initialAmount) {
      setAmountEarned(savedState.currentAmount - savedState.initialAmount);
    }
    
    // Cleanup function
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Start the timer
  const startTimer = (
    principal: number,
    rate: number,
    time: number,
    starting: number,
    startTime: number
  ) => {
    // Calculate final amount and amount per second
    const finalAmount = calculateFinalAmount(principal, rate, time);
    finalAmountRef.current = finalAmount;
    
    const secondsInYears = time * 365 * 24 * 60 * 60;
    totalSecondsRef.current = secondsInYears;
    
    const amountPerSecond = calculateAmountPerSecond(principal, finalAmount, time);
    amountPerSecondRef.current = amountPerSecond;
    initialAmountRef.current = principal;
    
    // Set initial state
    setCurrentAmount(starting);
    setStartTimestamp(startTime);
    setIsRunning(true);
    
    // Generate projection data for table with yearly intervals
    const tableData = calculateProjectionData(principal, finalAmount, time);
    setProjectionData(tableData);
    
    // Start interval
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = window.setInterval(() => {
      // Calculate elapsed time
      const now = Date.now();
      const elapsed = (now - startTime) / 1000; // seconds
      setElapsedSeconds(elapsed);
      
      // Calculate new amount
      const newAmount = principal + (amountPerSecond * elapsed);
      setCurrentAmount(newAmount);
      
      // Calculate amount earned
      setAmountEarned(newAmount - principal);
      
      // Update chart data periodically
      if (Math.floor(elapsed) % 10 === 0) {
        const updatedChartData = generateChartData(
          principal,
          finalAmount,
          time,
          newAmount
        );
        setChartData(updatedChartData);
      }
      
      // Calculate time elapsed percentage
      const percentage = calculateTimeElapsedPercentage(startTime, secondsInYears);
      setTimeElapsedPercentage(percentage);
      
      // Save state to localStorage
      saveState({
        initialAmount: principal,
        interestRate: rate,
        timeYears: time,
        isRunning: true,
        startTimestamp: startTime,
        currentAmount: newAmount
      });
      
      // Stop when we reach the time limit
      if (elapsed >= secondsInYears) {
        stopTimer();
        setCurrentAmount(finalAmount);
        toast.success("Congratulations! You've reached your financial goal!");
      }
    }, 1000);
  };
  
  // Stop the timer
  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRunning(false);
    
    // Save state to localStorage
    const state = loadState();
    saveState({
      ...state,
      isRunning: false,
      currentAmount
    });
  };
  
  // Handle form submission
  const handleCalculate = () => {
    try {
      const parsedInitialAmount = parseIndianCurrency(initialAmount);
      const parsedInterestRate = parseFloat(interestRate);
      const parsedTimeYears = parseFloat(timeYears);
      
      // Validate inputs
      if (isNaN(parsedInitialAmount) || parsedInitialAmount <= 0) {
        toast.error("Please enter a valid initial amount");
        return;
      }
      
      if (isNaN(parsedInterestRate) || parsedInterestRate <= 0) {
        toast.error("Please enter a valid interest rate");
        return;
      }
      
      if (isNaN(parsedTimeYears) || parsedTimeYears <= 0) {
        toast.error("Please enter a valid time period");
        return;
      }
      
      // Stop any existing timer
      stopTimer();
      
      // Reset elapsed time
      setElapsedSeconds(0);
      setTimeElapsedPercentage(0);
      initialAmountRef.current = parsedInitialAmount;
      
      // Set current amount to initial amount
      setCurrentAmount(parsedInitialAmount);
      
      // Reset amount earned
      setAmountEarned(0);
      
      // Generate chart data
      const finalAmount = calculateFinalAmount(
        parsedInitialAmount,
        parsedInterestRate,
        parsedTimeYears
      );
      
      const data = generateChartData(
        parsedInitialAmount,
        finalAmount,
        parsedTimeYears,
        parsedInitialAmount
      );
      setChartData(data);
      
      // Update projection table data with yearly intervals
      const tableData = calculateProjectionData(
        parsedInitialAmount,
        finalAmount,
        parsedTimeYears
      );
      setProjectionData(tableData);
      
      // Save new values to state
      saveState({
        initialAmount: parsedInitialAmount,
        interestRate: parsedInterestRate,
        timeYears: parsedTimeYears,
        isRunning: false,
        startTimestamp: null,
        currentAmount: parsedInitialAmount
      });
      
      // Automatically start the timer after calculating
      startTimer(
        parsedInitialAmount,
        parsedInterestRate,
        parsedTimeYears,
        parsedInitialAmount,
        Date.now()
      );
      
      toast.success("Calculation updated and timer started!");
    } catch (error) {
      console.error("Error calculating values:", error);
      toast.error("An error occurred. Please check your inputs.");
    }
  };
  
  // Handle start/stop button click
  const handleToggleTimer = () => {
    if (isRunning) {
      stopTimer();
    } else {
      try {
        const parsedInitialAmount = parseIndianCurrency(initialAmount);
        const parsedInterestRate = parseFloat(interestRate);
        const parsedTimeYears = parseFloat(timeYears);
        
        // Validate inputs
        if (isNaN(parsedInitialAmount) || parsedInitialAmount <= 0 ||
            isNaN(parsedInterestRate) || parsedInterestRate <= 0 ||
            isNaN(parsedTimeYears) || parsedTimeYears <= 0) {
          toast.error("Please check your input values");
          return;
        }
        
        startTimer(
          parsedInitialAmount,
          parsedInterestRate,
          parsedTimeYears,
          currentAmount,
          Date.now()
        );
        
        toast.success("Timer started!");
      } catch (error) {
        console.error("Error starting timer:", error);
        toast.error("An error occurred when starting the timer");
      }
    }
  };
  
  // Handle reset
  const handleReset = () => {
    stopTimer();
    
    const state = loadState();
    
    setCurrentAmount(state.initialAmount);
    setElapsedSeconds(0);
    setTimeElapsedPercentage(0);
    setAmountEarned(0);
    
    toast.info("Counter reset to initial amount");
  };
  
  // Format currency input on blur
  const handleAmountBlur = () => {
    try {
      const parsed = parseIndianCurrency(initialAmount);
      setInitialAmount(formatToIndianCurrency(parsed));
    } catch (error) {
      // If it fails to parse, keep the current value
    }
  };
  
  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-card p-3 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-money-primary">
            {formatToIndianCurrency(payload[0].value as number)}
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="container mx-auto py-4 md:py-8 px-2 md:px-4">
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {/* Header with Theme Picker */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-8">
          <div className="text-center md:text-left flex-1 mb-4 md:mb-0">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-money-gradient">
              Paisa Pragati Tracker
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto md:mx-0">
              Watch your money grow in real-time with our interactive tracker.
              Enter your initial amount, interest rate, and time period to see your wealth accumulate second by second.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <ThemePicker />
          </div>
        </div>
        
        {/* Money Counter */}
        <Card className="shadow-lg border-2 border-money-light">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-center text-lg md:text-xl">
              <IndianRupee className="w-5 h-5 md:w-6 md:h-6 mr-2 text-money-primary" />
              <span>Current Value</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Watch your money grow in real-time</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="text-3xl md:text-6xl font-bold py-4 md:py-8 money-counter text-money-primary animate-money-pulse">
              {formatToIndianCurrency(currentAmount)}
            </div>
            <div className="flex gap-2 md:gap-3 mt-2 md:mt-4 w-full max-w-xs md:max-w-sm">
              <Button 
                onClick={handleToggleTimer}
                className={isRunning ? "bg-destructive hover:bg-destructive/90" : "bg-money-primary hover:bg-money-primary/90"}
                size={isMobile ? "default" : "lg"}
                variant="default"
                disabled={!initialAmount || !interestRate || !timeYears}
              >
                {isRunning ? (
                  <>
                    <StopCircle className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                    Stop
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                    Start
                  </>
                )}
              </Button>
              <Button 
                onClick={handleReset}
                className="bg-muted hover:bg-muted/80 text-foreground"
                size={isMobile ? "default" : "lg"}
                variant="outline"
                disabled={!isRunning && currentAmount === parseIndianCurrency(initialAmount)}
              >
                <RefreshCw className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Input Form */}
        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg md:text-xl">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-2 text-money-primary" />
              <span>Investment Parameters</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Enter your investment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="initialAmount" className="text-sm">Initial Amount (₹)</Label>
                <Input
                  id="initialAmount"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  onBlur={handleAmountBlur}
                  placeholder="₹1,00,000.00"
                  disabled={isRunning}
                  className="border-money-primary/20 focus:border-money-primary text-sm md:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate" className="text-sm">Annual Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="12"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  disabled={isRunning}
                  className="border-money-primary/20 focus:border-money-primary text-sm md:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeYears" className="text-sm">Time Period (Years)</Label>
                <Input
                  id="timeYears"
                  value={timeYears}
                  onChange={(e) => setTimeYears(e.target.value)}
                  placeholder="5"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  disabled={isRunning}
                  className="border-money-primary/20 focus:border-money-primary text-sm md:text-base"
                />
              </div>
            </div>
            <Button 
              className="mt-4 md:mt-6 w-full md:w-auto md:px-8 bg-money-primary hover:bg-money-primary/90 text-sm md:text-base"
              onClick={handleCalculate}
              disabled={isRunning || !initialAmount || !interestRate || !timeYears}
            >
              Update Calculation
            </Button>
          </CardContent>
        </Card>
        
        {/* Time Tracker with Amount Earned */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg md:text-xl">
              <Clock className="w-4 h-4 md:w-5 md:h-5 mr-2 text-money-primary" />
              <span>Time Elapsed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">
                0
              </span>
              <span className="text-muted-foreground">
                {formatTimeElapsed(totalSecondsRef.current)}
              </span>
            </div>
            <Progress value={timeElapsedPercentage} className="h-2 bg-muted" />
            <div className="mt-4 flex flex-col md:flex-row md:justify-between items-center">
              <div className="text-center mb-3 md:mb-0">
                <div className="text-lg md:text-xl font-medium">
                  {formatTimeElapsed(elapsedSeconds)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">
                  {timeElapsedPercentage.toFixed(2)}% complete
                </div>
              </div>
              <div className="text-center bg-money-light/50 p-3 rounded-lg w-full md:w-auto">
                <div className="text-xs md:text-sm text-muted-foreground">Amount Earned</div>
                <div className="text-lg md:text-xl font-medium text-money-primary">
                  {formatToIndianCurrency(amountEarned)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">
                  {initialAmountRef.current > 0 ? ((amountEarned / initialAmountRef.current) * 100).toFixed(2) : 0}% growth
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Chart */}
        <Card className="shadow-md chart-container">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Growth Projection</CardTitle>
            <CardDescription className="text-xs md:text-sm">Visualize your investment growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData.map(item => ({ name: item.label, value: item.value }))}
                  margin={{ 
                    top: 5, 
                    right: isMobile ? 10 : 20, 
                    left: isMobile ? 10 : 20, 
                    bottom: 20 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickLine={{ stroke: '#E5E7EB' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    interval={isMobile ? 'preserveStartEnd' : 0}
                  />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
                      return `₹${value}`;
                    }}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickLine={{ stroke: '#E5E7EB' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    width={isMobile ? 40 : 60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--money-primary))" 
                    strokeWidth={isMobile ? 2 : 3}
                    dot={{ r: isMobile ? 3 : 4, strokeWidth: isMobile ? 1 : 2 }}
                    activeDot={{ r: isMobile ? 5 : 6, strokeWidth: isMobile ? 1 : 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Yearly Projection</CardTitle>
            <CardDescription className="text-xs md:text-sm">Year-by-year breakdown of your investment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 md:p-3 text-left font-medium border-b text-xs md:text-sm">Date</th>
                    <th className="p-2 md:p-3 text-left font-medium border-b text-xs md:text-sm">Projected Amount</th>
                    <th className="p-2 md:p-3 text-left font-medium border-b text-xs md:text-sm">Annual Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {projectionData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="p-2 md:p-3 border-b text-xs md:text-sm">{item.date}</td>
                      <td className="p-2 md:p-3 border-b font-medium text-money-primary text-xs md:text-sm">
                        {formatToIndianCurrency(item.amount)}
                      </td>
                      <td className="p-2 md:p-3 border-b text-xs md:text-sm">
                        <span className={item.growth > 0 ? 'text-money-primary' : 'text-destructive'}>
                          {item.growth.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MoneyTracker;
