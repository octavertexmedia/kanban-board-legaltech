const { Resend } = require('resend');

const resend = new Resend('re_aJsaynXN_C4Vhx45FxRN22ThBFdmddAGV');

async function testEmail() {
    try {
        const data = await resend.emails.send({
            from: 'Cengineers Kanban <onboarding@resend.dev>',
            to: ['myarupslg@gmail.com'],
            subject: 'Test Notification - Drag & Drop Working',
            html: '<strong>Success!</strong> Your setup works and emails are delivering.',
        });

        console.log('Email sent successfully:', data);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

testEmail();
