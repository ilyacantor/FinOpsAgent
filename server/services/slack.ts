import { WebClient, type ChatPostMessageArguments } from "@slack/web-api";

if (!process.env.SLACK_BOT_TOKEN) {
  throw new Error("SLACK_BOT_TOKEN environment variable must be set");
}

if (!process.env.SLACK_CHANNEL_ID) {
  throw new Error("SLACK_CHANNEL_ID environment variable must be set");
}

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function sendSlackMessage(
  message: ChatPostMessageArguments
): Promise<string | undefined> {
  try {
    const response = await slack.chat.postMessage(message);
    return response.ts;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw error;
  }
}

export async function sendOptimizationRecommendation(recommendation: {
  title: string;
  description: string;
  resourceId: string;
  projectedMonthlySavings: number;
  projectedAnnualSavings: number;
  priority: string;
  recommendationId: string;
}) {
  const channel = process.env.SLACK_CHANNEL_ID!;
  
  const priorityEmoji = {
    critical: '🚨',
    high: '⚠️',
    medium: '📊',
    low: 'ℹ️'
  };

  const message = {
    channel,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${priorityEmoji[recommendation.priority as keyof typeof priorityEmoji]} New Cost Optimization Opportunity`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Resource:* ${recommendation.resourceId}`
          },
          {
            type: 'mrkdwn',
            text: `*Priority:* ${recommendation.priority.toUpperCase()}`
          },
          {
            type: 'mrkdwn',
            text: `*Monthly Savings:* $${recommendation.projectedMonthlySavings.toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Annual Savings:* $${recommendation.projectedAnnualSavings.toLocaleString()}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${recommendation.title}*\n${recommendation.description}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Review in Dashboard'
            },
            style: 'primary',
            url: `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}`,
            action_id: 'review_recommendation'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Approve'
            },
            style: 'primary',
            action_id: 'approve_recommendation',
            value: recommendation.recommendationId
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Reject'
            },
            style: 'danger',
            action_id: 'reject_recommendation',
            value: recommendation.recommendationId
          }
        ]
      }
    ]
  };

  return await sendSlackMessage(message);
}

export async function sendOptimizationComplete(optimization: {
  title: string;
  resourceId: string;
  actualSavings: number;
  status: string;
}) {
  const channel = process.env.SLACK_CHANNEL_ID!;
  
  const statusEmoji = optimization.status === 'success' ? '✅' : '❌';
  
  const message = {
    channel,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${statusEmoji} Optimization ${optimization.status === 'success' ? 'Completed' : 'Failed'}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Resource:* ${optimization.resourceId}`
          },
          {
            type: 'mrkdwn',
            text: `*Status:* ${optimization.status.toUpperCase()}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${optimization.title}*`
        }
      }
    ]
  };

  if (optimization.status === 'success' && optimization.actualSavings) {
    message.blocks.splice(2, 0, {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `💰 *Monthly Savings Realized:* $${optimization.actualSavings.toLocaleString()}`
      }
    });
  }

  return await sendSlackMessage(message);
}
