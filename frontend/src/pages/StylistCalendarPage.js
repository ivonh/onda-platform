import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { 
  Clock, 
  CalendarDays, 
  Save, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  X,
  User,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { format, addDays, startOfWeek, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const TIME_SLOTS = [];
for (let hour = 6; hour <= 22; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const displayTime = format(new Date(2024, 0, 1, hour, minute), 'h:mm a');
    TIME_SLOTS.push({ value: time, label: displayTime });
  }
}

const DEFAULT_WORKING_HOURS = DAYS_OF_WEEK.map(day => ({
  day_of_week: day.value,
  start_time: '09:00',
  end_time: '17:00',
  is_available: day.value !== 0 && day.value !== 6,
}));

export default function StylistCalendarPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);
  const [bookings, setBookings] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    reason: ''
  });

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const response = await api.get('/availability/my-calendar');
      const data = response.data;
      
      if (data.availability_slots && data.availability_slots.length > 0) {
        setWorkingHours(data.availability_slots);
      }
      setBookings(data.bookings || []);
      setBlockedTimes(data.blocked_times || []);
    } catch (error) {
      console.error('Failed to load calendar:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkingHours = async () => {
    setSaving(true);
    try {
      await api.post('/availability/set', { slots: workingHours });
      toast.success('Working hours saved!');
    } catch (error) {
      toast.error('Failed to save working hours');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBlockTime = async () => {
    try {
      const startDateTime = new Date(blockForm.date);
      const [startHour, startMin] = blockForm.startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

      const endDateTime = new Date(blockForm.date);
      const [endHour, endMin] = blockForm.endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

      await api.post('/availability/block-time', {
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        reason: blockForm.reason || 'Personal time'
      });

      toast.success('Time blocked successfully');
      setBlockDialogOpen(false);
      fetchCalendarData();
    } catch (error) {
      toast.error('Failed to block time');
      console.error('Block error:', error);
    }
  };

  const updateWorkingHour = (dayIndex, field, value) => {
    setWorkingHours(prev => prev.map((day, idx) => 
      idx === dayIndex ? { ...day, [field]: value } : day
    ));
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  }, [currentWeek]);

  const getBookingsForDate = (date) => {
    return bookings.filter(booking => {
      const bookingDate = parseISO(booking.scheduled_datetime);
      return isSameDay(bookingDate, date);
    });
  };

  const getBlockedTimesForDate = (date) => {
    return blockedTimes.filter(block => {
      const blockDate = parseISO(block.start_datetime);
      return isSameDay(blockDate, date);
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="font-playfair text-4xl font-bold text-primary mb-2">
            Calendar & Availability
          </h1>
          <p className="text-muted-foreground">
            Manage your working hours, availability, and view your bookings
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-border/40">
              <CardHeader>
                <CardTitle className="font-playfair text-xl flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {workingHours.map((day, index) => (
                  <div key={day.day_of_week} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={day.is_available}
                          onCheckedChange={(checked) => updateWorkingHour(index, 'is_available', checked)}
                          aria-label={`Toggle ${DAYS_OF_WEEK[day.day_of_week].label} availability`}
                        />
                        <Label className={day.is_available ? 'text-foreground' : 'text-muted-foreground'}>
                          {DAYS_OF_WEEK[day.day_of_week].label}
                        </Label>
                      </div>
                    </div>
                    
                    {day.is_available && (
                      <div className="flex items-center gap-2 ml-10">
                        <Select
                          value={day.start_time}
                          onValueChange={(value) => updateWorkingHour(index, 'start_time', value)}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map(slot => (
                              <SelectItem key={slot.value} value={slot.value}>
                                {slot.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground text-sm">to</span>
                        <Select
                          value={day.end_time}
                          onValueChange={(value) => updateWorkingHour(index, 'end_time', value)}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map(slot => (
                              <SelectItem key={slot.value} value={slot.value}>
                                {slot.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}

                <Separator className="my-4" />

                <Button
                  onClick={handleSaveWorkingHours}
                  disabled={saving}
                  className="w-full btn-primary"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Working Hours
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border/40">
              <CardHeader>
                <CardTitle className="font-playfair text-xl flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-primary/30"
                  onClick={() => {
                    setBlockForm({ ...blockForm, date: new Date() });
                    setBlockDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Block Time Off
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="border border-border/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-playfair text-xl flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Weekly Schedule
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[180px] text-center">
                      {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {weekDays.map((date, idx) => {
                    const dayBookings = getBookingsForDate(date);
                    const dayBlocked = getBlockedTimesForDate(date);
                    const dayOfWeek = date.getDay();
                    const workingDay = workingHours.find(w => w.day_of_week === dayOfWeek);
                    const isAvailable = workingDay?.is_available;
                    const isToday = isSameDay(date, new Date());

                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border cursor-pointer transition-all min-h-[120px] ${
                          isToday 
                            ? 'border-primary bg-primary/5' 
                            : isAvailable 
                              ? 'border-border/40 hover:border-primary/50' 
                              : 'border-border/20 bg-muted/30'
                        } ${selectedDate && isSameDay(date, selectedDate) ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="text-center mb-2">
                          <p className="text-xs text-muted-foreground">
                            {DAYS_OF_WEEK[dayOfWeek].short}
                          </p>
                          <p className={`text-lg font-semibold ${isToday ? 'text-primary' : ''}`}>
                            {format(date, 'd')}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          {dayBookings.slice(0, 2).map((booking, bIdx) => (
                            <div
                              key={bIdx}
                              className={`text-xs p-1 rounded ${getStatusColor(booking.status)} text-white truncate`}
                            >
                              {format(parseISO(booking.scheduled_datetime), 'h:mm a')}
                            </div>
                          ))}
                          {dayBookings.length > 2 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{dayBookings.length - 2} more
                            </p>
                          )}
                          {dayBlocked.length > 0 && (
                            <div className="text-xs p-1 rounded bg-gray-600 text-white text-center">
                              Blocked
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedDate && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-semibold mb-3">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </h3>
                      
                      {getBookingsForDate(selectedDate).length > 0 ? (
                        <div className="space-y-3">
                          {getBookingsForDate(selectedDate).map((booking, idx) => (
                            <div
                              key={idx}
                              className="p-4 border border-border/40 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{booking.client_name || 'Client'}</span>
                                </div>
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(booking.scheduled_datetime), 'h:mm a')} 
                                  ({booking.estimated_duration_minutes || 60} min)
                                </p>
                                {booking.client_location?.address && (
                                  <p className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {booking.client_location.address}
                                  </p>
                                )}
                                <div className="flex gap-1 mt-2">
                                  {booking.services?.map((service, sIdx) => (
                                    <Badge key={sIdx} variant="outline" className="text-xs capitalize">
                                      {service.replace('_', ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-6">
                          No bookings for this day
                        </p>
                      )}

                      {getBlockedTimesForDate(selectedDate).length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Blocked Times</h4>
                          {getBlockedTimesForDate(selectedDate).map((block, idx) => (
                            <div key={idx} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                              <div>
                                <p className="text-sm">
                                  {format(parseISO(block.start_datetime), 'h:mm a')} - {format(parseISO(block.end_datetime), 'h:mm a')}
                                </p>
                                {block.reason && (
                                  <p className="text-xs text-muted-foreground">{block.reason}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block Time Off</DialogTitle>
              <DialogDescription>
                Block a specific time period when you're unavailable for bookings.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label className="mb-2 block">Date</Label>
                <Calendar
                  mode="single"
                  selected={blockForm.date}
                  onSelect={(date) => date && setBlockForm({ ...blockForm, date })}
                  className="rounded-md border"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Start Time</Label>
                  <Select
                    value={blockForm.startTime}
                    onValueChange={(value) => setBlockForm({ ...blockForm, startTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">End Time</Label>
                  <Select
                    value={blockForm.endTime}
                    onValueChange={(value) => setBlockForm({ ...blockForm, endTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Reason (optional)</Label>
                <Input
                  placeholder="e.g., Doctor's appointment, Personal time"
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBlockTime} className="btn-primary">
                Block Time
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
