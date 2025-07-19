import nodemailer from 'nodemailer';

// Email configuration - these should be in environment variables
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '' // App password for Gmail
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
const emailTemplates = {
  taskCreated: (taskTitle: string, dueDate?: string) => ({
    subject: `New Task Created: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Task Created</h2>
        <p>A new task has been created in your IntelliTask account:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0; color: #1f2937;">${taskTitle}</h3>
          ${dueDate ? `<p style="margin: 8px 0 0 0; color: #6b7280;">Due: ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
        </div>
        <p>You can view and manage your tasks in IntelliTask.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated notification from IntelliTask.</p>
      </div>
    `
  }),

  taskCompleted: (taskTitle: string) => ({
    subject: `Task Completed: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Task Completed</h2>
        <p>Congratulations! You have completed a task:</p>
        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin: 0; color: #1f2937;">${taskTitle}</h3>
        </div>
        <p>Great job on staying productive!</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated notification from IntelliTask.</p>
      </div>
    `
  }),

  taskOverdue: (taskTitle: string, dueDate: string) => ({
    subject: `Overdue Task: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Task Overdue</h2>
        <p>The following task is overdue and needs your attention:</p>
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0; color: #1f2937;">${taskTitle}</h3>
          <p style="margin: 8px 0 0 0; color: #dc2626;">Was due: ${new Date(dueDate).toLocaleDateString()}</p>
        </div>
        <p>Please review and update your task status.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated notification from IntelliTask.</p>
      </div>
    `
  }),

  taskDueSoon: (taskTitle: string, dueDate: string) => ({
    subject: `Task Due Soon: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Task Due Soon</h2>
        <p>The following task is due soon:</p>
        <div style="background-color: #fff7ed; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ea580c;">
          <h3 style="margin: 0; color: #1f2937;">${taskTitle}</h3>
          <p style="margin: 8px 0 0 0; color: #ea580c;">Due: ${new Date(dueDate).toLocaleDateString()}</p>
        </div>
        <p>Don't forget to complete this task on time!</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated notification from IntelliTask.</p>
      </div>
    `
  }),

  weeklyDigest: (stats: {totalTasks: number, completedTasks: number, pendingTasks: number, overdueCount: number}) => ({
    subject: 'Your Weekly Task Summary',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Weekly Task Summary</h2>
        <p>Here's your productivity summary for this week:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #1f2937; font-weight: bold;">Total Tasks:</span>
            <span style="color: #2563eb; font-weight: bold;">${stats.totalTasks}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #1f2937; font-weight: bold;">Completed:</span>
            <span style="color: #16a34a; font-weight: bold;">${stats.completedTasks}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #1f2937; font-weight: bold;">Pending:</span>
            <span style="color: #ea580c; font-weight: bold;">${stats.pendingTasks}</span>
          </div>
          ${stats.overdueCount > 0 ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #1f2937; font-weight: bold;">Overdue:</span>
            <span style="color: #dc2626; font-weight: bold;">${stats.overdueCount}</span>
          </div>
          ` : ''}
        </div>
        <p>Keep up the great work!</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated weekly digest from IntelliTask.</p>
      </div>
    `
  })
};

type TemplateData = {
  taskTitle?: string;
  dueDate?: string;
  totalTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
  overdueCount?: number;
};

export async function sendEmail(to: string, templateKey: keyof typeof emailTemplates, data: TemplateData) {
  try {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('Email credentials not configured');
      return { success: false, error: 'Email credentials not configured' };
    }

    let template;
    
    switch (templateKey) {
      case 'taskCreated':
        template = emailTemplates.taskCreated(data.taskTitle!, data.dueDate);
        break;
      case 'taskCompleted':
        template = emailTemplates.taskCompleted(data.taskTitle!);
        break;
      case 'taskOverdue':
        template = emailTemplates.taskOverdue(data.taskTitle!, data.dueDate!);
        break;
      case 'taskDueSoon':
        template = emailTemplates.taskDueSoon(data.taskTitle!, data.dueDate!);
        break;
      case 'weeklyDigest':
        template = emailTemplates.weeklyDigest({
          totalTasks: data.totalTasks!,
          completedTasks: data.completedTasks!,
          pendingTasks: data.pendingTasks!,
          overdueCount: data.overdueCount!
        });
        break;
      default:
        throw new Error(`Unknown template key: ${templateKey}`);
    }
    
    const mailOptions = {
      from: `IntelliTask <${emailConfig.auth.user}>`,
      to,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export { emailTemplates };