import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Grid,
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { Event } from '../types/project';

const API_BASE_URL = 'https://localhost:3000/api';

interface ProjectDetailProps {
    projectId: string;
    userEmail: string;
    onBack: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, userEmail, onBack }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [isCreateEventOpen, setCreateEventOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [newEvent, setNewEvent] = useState({
        title: '',
        startDate: null as Date | null,
        startTime: null as Date | null,
        endDate: null as Date | null,
        endTime: null as Date | null,
        isAllDay: false,
        reminderValue: '30', // 預設提前30分鐘提醒
        reminderUnit: 'minutes', // 預設單位為分鐘
    });

    useEffect(() => {
        fetchEvents();
    }, [projectId]);

    const fetchEvents = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${projectId}/events`);
            const data = await response.json();
            if (data.success) {
                setEvents(data.data);
            }
        } catch (error) {
            console.error('獲取事件列表失敗:', error);
        }
    };

    const handleCheckboxChange = (eventId: string, event: React.MouseEvent) => {
        // 阻止事件冒泡，防止觸發行點擊事件
        event.stopPropagation();
        
        setSelectedEvents(prev =>
            prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
        );
    };

    const handleEditEvent = (eventId: string) => {
        const eventToEdit = events.find(event => event._id.toString() === eventId);
        if (!eventToEdit) return;
        
        // 將事件數據填充到表單中
        const startDate = new Date(eventToEdit.startTime);
        const endDate = new Date(eventToEdit.endTime);
        
        setNewEvent({
            title: eventToEdit.title,
            startDate: startDate,
            startTime: startDate,
            endDate: endDate,
            endTime: endDate,
            isAllDay: eventToEdit.isAllDay,
            reminderValue: '30', // 默認值，因為Event類型中沒有這些字段
            reminderUnit: 'minutes'
        });
        
        setEditingEventId(eventId);
        setIsEditMode(true);
        setCreateEventOpen(true);
    };
    
    const handleCreateEvent = async () => {
        try {
            // 驗證提醒值
            if (!newEvent.reminderValue || parseInt(newEvent.reminderValue) <= 0) {
                alert('提前提醒時間必須大於0');
                return;
            }
            
            // 驗證日期和時間
            if (!newEvent.startDate) {
                alert('請選擇開始日期');
                return;
            }
            
            if (!newEvent.endDate) {
                alert('請選擇結束日期');
                return;
            }
            
            if (!newEvent.isAllDay && (!newEvent.startTime || !newEvent.endTime)) {
                alert('請選擇開始和結束時間');
                return;
            }
            
            // 組合日期和時間
            let startDateTime = new Date(newEvent.startDate);
            let endDateTime = new Date(newEvent.endDate);
            
            if (!newEvent.isAllDay && newEvent.startTime && newEvent.endTime) {
                startDateTime.setHours(
                    newEvent.startTime.getHours(),
                    newEvent.startTime.getMinutes(),
                    0,
                    0
                );
                
                endDateTime.setHours(
                    newEvent.endTime.getHours(),
                    newEvent.endTime.getMinutes(),
                    0,
                    0
                );
            } else if (newEvent.isAllDay) {
                startDateTime.setHours(0, 0, 0, 0);
                endDateTime.setHours(23, 59, 59, 999);
            }
            
            // 計算提醒時間（轉換為分鐘）
            let reminderMinutes = parseInt(newEvent.reminderValue);
            switch (newEvent.reminderUnit) {
                case 'hours':
                    reminderMinutes *= 60;
                    break;
                case 'days':
                    reminderMinutes *= 60 * 24;
                    break;
            }
            
            const url = isEditMode 
                ? `${API_BASE_URL}/events/${editingEventId}` 
                : `${API_BASE_URL}/events`;
                
            const method = isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId,
                    title: newEvent.title,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    isAllDay: newEvent.isAllDay,
                    participants: [userEmail],
                    creatorEmail: userEmail,
                    reminderMinutes: reminderMinutes,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setCreateEventOpen(false);
                setNewEvent({
                    title: '',
                    startDate: null,
                    startTime: null,
                    endDate: null,
                    endTime: null,
                    isAllDay: false,
                    reminderValue: '30',
                    reminderUnit: 'minutes',
                });
                setIsEditMode(false);
                setEditingEventId(null);
                fetchEvents();
            } else {
                alert(isEditMode ? '更新事件失敗: ' + data.message : '創建事件失敗: ' + data.message);
            }
        } catch (error) {
            console.error(isEditMode ? '更新事件失敗:' : '創建事件失敗:', error);
        }
    };

    const handleDeleteEvents = async () => {
        try {
            await Promise.all(
                selectedEvents.map(eventId =>
                    fetch(`${API_BASE_URL}/events/${eventId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ userEmail }),
                    })
                )
            );
            setSelectedEvents([]);
            fetchEvents();
        } catch (error) {
            console.error('刪除事件失敗:', error);
        }
    };

    const handleShareCalendar = () => {
        const calendarUrl = `${API_BASE_URL}/projects/${projectId}/calendar.ics`;
        navigator.clipboard.writeText(calendarUrl)
            .then(() => {
                alert('日曆訂閱鏈接已複製到剪貼板！');
            })
            .catch(err => {
                console.error('複製到剪貼板失敗:', err);
                // 如果複製失敗，則回退到原來的方式
                window.open(calendarUrl, '_blank');
            });
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 2 }}>
                {/* 根據用戶需求，移除返回項目列表按鈕 */}
                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" component="h1">
                        事件管理
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            onClick={() => setCreateEventOpen(true)}
                            sx={{ bgcolor: '#1a73e8' }}
                        >
                            添加事件
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => handleEditEvent(selectedEvents[0])}
                            disabled={selectedEvents.length !== 1}
                            sx={{ bgcolor: selectedEvents.length === 1 ? '#1a73e8' : undefined }}
                        >
                            編輯事件
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleDeleteEvents}
                            disabled={selectedEvents.length === 0}
                            sx={{ bgcolor: selectedEvents.length > 0 ? '#dc3545' : undefined }}
                        >
                            刪除事件
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            <TableContainer component={Paper}>
                {events.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography>目前沒有事件</Typography>
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox"></TableCell>
                                <TableCell>事件標題</TableCell>
                                <TableCell>開始時間</TableCell>
                                <TableCell>結束時間</TableCell>
                                <TableCell>全天事件</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow key={event._id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedEvents.includes(event._id)}
                                            onChange={(e) => handleCheckboxChange(event._id, e)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </TableCell>
                                    <TableCell>{event.title}</TableCell>
                                    <TableCell>
                                        {event.isAllDay 
                                            ? new Date(event.startTime).toLocaleDateString() 
                                            : new Date(event.startTime).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'})}
                                    </TableCell>
                                    <TableCell>
                                        {event.isAllDay 
                                            ? new Date(event.endTime).toLocaleDateString() 
                                            : new Date(event.endTime).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'})}
                                    </TableCell>
                                    <TableCell>
                                        {event.isAllDay ? '是' : '否'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>

            <Dialog open={isCreateEventOpen} onClose={() => {
                setCreateEventOpen(false);
                setIsEditMode(false);
                setEditingEventId(null);
                setNewEvent({
                    title: '',
                    startDate: null,
                    startTime: null,
                    endDate: null,
                    endTime: null,
                    isAllDay: false,
                    reminderValue: '30',
                    reminderUnit: 'minutes',
                });
            }} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditMode ? '編輯事件' : '創建事件'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="事件標題"
                        fullWidth
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography component="label" display="flex" alignItems="center">
                            <Checkbox
                                checked={newEvent.isAllDay}
                                onChange={(e) => setNewEvent({ ...newEvent, isAllDay: e.target.checked })}
                            />
                            全天事件
                        </Typography>
                    </Box>
                    
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="開始日期"
                                    value={newEvent.startDate}
                                    onChange={(date) => setNewEvent({ ...newEvent, startDate: date })}
                                    slotProps={{ 
                                        textField: { 
                                            fullWidth: true,
                                            margin: "dense",
                                            sx: { mb: 2 }
                                        } 
                                    }}
                                />
                            </Grid>
                            {!newEvent.isAllDay && (
                                <Grid item xs={12} sm={6}>
                                    <TimePicker
                                        label="開始時間"
                                        value={newEvent.startTime}
                                        onChange={(time) => setNewEvent({ ...newEvent, startTime: time })}
                                        views={['hours', 'minutes']}
                                        slotProps={{ 
                                            textField: { 
                                                fullWidth: true,
                                                margin: "dense",
                                                sx: { mb: 2 }
                                            } 
                                        }}
                                    />
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="結束日期"
                                    value={newEvent.endDate}
                                    onChange={(date) => setNewEvent({ ...newEvent, endDate: date })}
                                    slotProps={{ 
                                        textField: { 
                                            fullWidth: true,
                                            margin: "dense",
                                            sx: { mb: 2 }
                                        } 
                                    }}
                                />
                            </Grid>
                            {!newEvent.isAllDay && (
                                <Grid item xs={12} sm={6}>
                                    <TimePicker
                                        label="結束時間"
                                        value={newEvent.endTime}
                                        onChange={(time) => setNewEvent({ ...newEvent, endTime: time })}
                                        views={['hours', 'minutes']}
                                        slotProps={{ 
                                            textField: { 
                                                fullWidth: true,
                                                margin: "dense",
                                                sx: { mb: 2 }
                                            } 
                                        }}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </LocalizationProvider>
                    
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            提前提醒
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    type="number"
                                    label="提醒時間"
                                    fullWidth
                                    value={newEvent.reminderValue}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || parseInt(value) > 0) {
                                            setNewEvent({ ...newEvent, reminderValue: value });
                                        }
                                    }}
                                    helperText="必須大於0"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>時間單位</InputLabel>
                                    <Select
                                        value={newEvent.reminderUnit}
                                        label="時間單位"
                                        onChange={(e) => setNewEvent({ ...newEvent, reminderUnit: e.target.value })}
                                    >
                                        <MenuItem value="minutes">分鐘</MenuItem>
                                        <MenuItem value="hours">小時</MenuItem>
                                        <MenuItem value="days">天</MenuItem>
                                    </Select>
                                    <FormHelperText>選擇提醒時間單位</FormHelperText>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setCreateEventOpen(false);
                        setIsEditMode(false);
                        setEditingEventId(null);
                        setNewEvent({
                            title: '',
                            startDate: null,
                            startTime: null,
                            endDate: null,
                            endTime: null,
                            isAllDay: false,
                            reminderValue: '30',
                            reminderUnit: 'minutes',
                        });
                    }}>取消</Button>
                    <Button onClick={handleCreateEvent} color="primary" variant="contained">
                        {isEditMode ? '更新' : '創建'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};