// Workflow Automation Engine for Client Management

/**
 * Workflow trigger types
 */
export const TRIGGER_TYPES = {
  CLIENT_CREATED: 'client_created',
  CLIENT_UPDATED: 'client_updated',
  NO_CONTACT: 'no_contact',
  STATUS_CHANGE: 'status_change',
  HEALTH_SCORE_LOW: 'health_score_low',
  REVENUE_THRESHOLD: 'revenue_threshold',
  TASK_OVERDUE: 'task_overdue',
  DOCUMENT_EXPIRING: 'document_expiring',
  SCHEDULED: 'scheduled'
};

/**
 * Workflow action types
 */
export const ACTION_TYPES = {
  SEND_EMAIL: 'send_email',
  SEND_SMS: 'send_sms',
  CREATE_TASK: 'create_task',
  UPDATE_CLIENT: 'update_client',
  ADD_TAG: 'add_tag',
  SEND_NOTIFICATION: 'send_notification',
  ASSIGN_TO_USER: 'assign_to_user'
};

/**
 * Default workflow templates
 */
export const WORKFLOW_TEMPLATES = [
  {
    id: 'onboarding',
    name: 'Client Onboarding',
    description: 'Automated onboarding workflow for new clients',
    trigger: {
      type: TRIGGER_TYPES.CLIENT_CREATED,
      conditions: []
    },
    actions: [
      {
        type: ACTION_TYPES.SEND_EMAIL,
        delay: 0,
        config: {
          template: 'welcome',
          subject: 'Welcome to Our Tax Services',
          body: 'Thank you for choosing us for your tax needs...'
        }
      },
      {
        type: ACTION_TYPES.CREATE_TASK,
        delay: 0,
        config: {
          title: 'Initial consultation call',
          priority: 'high',
          dueInDays: 3
        }
      },
      {
        type: ACTION_TYPES.SEND_EMAIL,
        delay: 86400000, // 1 day
        config: {
          template: 'document_request',
          subject: 'Documents Needed',
          body: 'Please provide the following documents...'
        }
      }
    ],
    active: true
  },
  {
    id: 'follow_up',
    name: 'Follow-up Reminder',
    description: 'Remind to contact clients after 30 days of no contact',
    trigger: {
      type: TRIGGER_TYPES.NO_CONTACT,
      conditions: [
        { field: 'daysSinceContact', operator: '>', value: 30 },
        { field: 'status', operator: '==', value: 'Active' }
      ]
    },
    actions: [
      {
        type: ACTION_TYPES.SEND_NOTIFICATION,
        delay: 0,
        config: {
          title: 'Client Follow-up Needed',
          message: 'Client has not been contacted in 30+ days',
          priority: 'medium'
        }
      },
      {
        type: ACTION_TYPES.CREATE_TASK,
        delay: 0,
        config: {
          title: 'Follow up with client',
          priority: 'medium',
          dueInDays: 7
        }
      }
    ],
    active: true
  },
  {
    id: 'health_alert',
    name: 'Client Health Alert',
    description: 'Alert when client health score drops below threshold',
    trigger: {
      type: TRIGGER_TYPES.HEALTH_SCORE_LOW,
      conditions: [
        { field: 'healthScore', operator: '<', value: 40 }
      ]
    },
    actions: [
      {
        type: ACTION_TYPES.SEND_NOTIFICATION,
        delay: 0,
        config: {
          title: 'Client At Risk',
          message: 'Client health score is critically low',
          priority: 'high'
        }
      },
      {
        type: ACTION_TYPES.ADD_TAG,
        delay: 0,
        config: {
          tagName: 'Needs Attention'
        }
      },
      {
        type: ACTION_TYPES.CREATE_TASK,
        delay: 0,
        config: {
          title: 'Urgent: Contact at-risk client',
          priority: 'high',
          dueInDays: 2
        }
      }
    ],
    active: true
  },
  {
    id: 'inactive_reengagement',
    name: 'Inactive Client Re-engagement',
    description: 'Re-engage clients who have become inactive',
    trigger: {
      type: TRIGGER_TYPES.STATUS_CHANGE,
      conditions: [
        { field: 'status', operator: '==', value: 'Inactive' }
      ]
    },
    actions: [
      {
        type: ACTION_TYPES.SEND_EMAIL,
        delay: 604800000, // 7 days
        config: {
          template: 'reengagement',
          subject: 'We Miss You!',
          body: 'We noticed you haven\'t been active recently...'
        }
      },
      {
        type: ACTION_TYPES.SEND_NOTIFICATION,
        delay: 0,
        config: {
          title: 'Client Became Inactive',
          message: 'Consider reaching out to re-engage',
          priority: 'low'
        }
      }
    ],
    active: true
  }
];

/**
 * Evaluate if a trigger condition is met
 * @param {Object} client - Client object
 * @param {Object} condition - Condition to evaluate
 * @returns {boolean} - Whether condition is met
 */
const evaluateCondition = (client, condition) => {
  const { field, operator, value } = condition;
  let clientValue;

  // Get client value based on field
  switch (field) {
    case 'daysSinceContact':
      clientValue = Math.floor(
        (new Date() - new Date(client.lastContact)) / (1000 * 60 * 60 * 24)
      );
      break;
    case 'healthScore':
      // Would need to calculate health score
      clientValue = client.healthScore || 0;
      break;
    case 'status':
      clientValue = client.status;
      break;
    case 'revenue':
      clientValue = parseFloat(client.totalRevenue?.replace(/[$,]/g, '') || 0);
      break;
    default:
      clientValue = client[field];
  }

  // Evaluate based on operator
  switch (operator) {
    case '>':
      return clientValue > value;
    case '<':
      return clientValue < value;
    case '>=':
      return clientValue >= value;
    case '<=':
      return clientValue <= value;
    case '==':
      return clientValue === value;
    case '!=':
      return clientValue !== value;
    default:
      return false;
  }
};

/**
 * Check if workflow should be triggered for a client
 * @param {Object} workflow - Workflow configuration
 * @param {Object} client - Client object
 * @param {string} eventType - Type of event that occurred
 * @returns {boolean} - Whether workflow should trigger
 */
export const shouldTriggerWorkflow = (workflow, client, eventType) => {
  if (!workflow.active) return false;
  if (workflow.trigger.type !== eventType) return false;

  // Check all conditions
  return workflow.trigger.conditions.every(condition => 
    evaluateCondition(client, condition)
  );
};

/**
 * Execute a workflow action
 * @param {Object} action - Action configuration
 * @param {Object} client - Client object
 * @param {Function} callbacks - Callback functions for different actions
 * @returns {Promise} - Action execution result
 */
export const executeAction = async (action, client, callbacks) => {
  const { type, config } = action;

  switch (type) {
    case ACTION_TYPES.SEND_EMAIL:
      if (callbacks.sendEmail) {
        return callbacks.sendEmail({
          to: client.email,
          subject: config.subject,
          body: config.body.replace('[Client Name]', client.name),
          template: config.template
        });
      }
      break;

    case ACTION_TYPES.SEND_SMS:
      if (callbacks.sendSMS) {
        return callbacks.sendSMS({
          to: client.phone,
          message: config.message.replace('[Client Name]', client.name)
        });
      }
      break;

    case ACTION_TYPES.CREATE_TASK:
      if (callbacks.createTask) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (config.dueInDays || 7));
        
        return callbacks.createTask({
          title: config.title,
          clientId: client.id,
          clientName: client.name,
          priority: config.priority || 'medium',
          dueDate: dueDate.toISOString().split('T')[0],
          status: 'pending'
        });
      }
      break;

    case ACTION_TYPES.UPDATE_CLIENT:
      if (callbacks.updateClient) {
        return callbacks.updateClient(client.id, config.updates);
      }
      break;

    case ACTION_TYPES.ADD_TAG:
      if (callbacks.addTag) {
        return callbacks.addTag(client.id, config.tagName);
      }
      break;

    case ACTION_TYPES.SEND_NOTIFICATION:
      if (callbacks.sendNotification) {
        return callbacks.sendNotification({
          title: config.title,
          message: `${config.message} - ${client.name}`,
          priority: config.priority || 'medium',
          clientId: client.id
        });
      }
      break;

    case ACTION_TYPES.ASSIGN_TO_USER:
      if (callbacks.assignToUser) {
        return callbacks.assignToUser(client.id, config.userId);
      }
      break;

    default:
      console.warn(`Unknown action type: ${type}`);
  }
};

/**
 * Execute a workflow for a client
 * @param {Object} workflow - Workflow configuration
 * @param {Object} client - Client object
 * @param {Object} callbacks - Callback functions
 * @returns {Promise} - Workflow execution result
 */
export const executeWorkflow = async (workflow, client, callbacks) => {
  const results = [];

  for (const action of workflow.actions) {
    // Handle delayed actions
    if (action.delay > 0) {
      setTimeout(async () => {
        const result = await executeAction(action, client, callbacks);
        results.push({ action: action.type, result, delayed: true });
      }, action.delay);
    } else {
      const result = await executeAction(action, client, callbacks);
      results.push({ action: action.type, result, delayed: false });
    }
  }

  return {
    workflowId: workflow.id,
    workflowName: workflow.name,
    clientId: client.id,
    clientName: client.name,
    executedAt: new Date().toISOString(),
    results
  };
};

/**
 * Check all clients against all workflows
 * @param {Array} clients - Array of client objects
 * @param {Array} workflows - Array of workflow configurations
 * @param {string} eventType - Type of event to check
 * @param {Object} callbacks - Callback functions
 * @returns {Promise<Array>} - Array of execution results
 */
export const checkWorkflows = async (clients, workflows, eventType, callbacks) => {
  const executions = [];

  for (const client of clients) {
    for (const workflow of workflows) {
      if (shouldTriggerWorkflow(workflow, client, eventType)) {
        const result = await executeWorkflow(workflow, client, callbacks);
        executions.push(result);
      }
    }
  }

  return executions;
};

/**
 * Get workflow execution history
 * @param {Array} executions - Array of execution results
 * @param {Object} filters - Filter options
 * @returns {Array} - Filtered execution history
 */
export const getWorkflowHistory = (executions, filters = {}) => {
  let filtered = [...executions];

  if (filters.clientId) {
    filtered = filtered.filter(e => e.clientId === filters.clientId);
  }

  if (filters.workflowId) {
    filtered = filtered.filter(e => e.workflowId === filters.workflowId);
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(e => new Date(e.executedAt) >= new Date(filters.dateFrom));
  }

  if (filters.dateTo) {
    filtered = filtered.filter(e => new Date(e.executedAt) <= new Date(filters.dateTo));
  }

  return filtered.sort((a, b) => new Date(b.executedAt) - new Date(e.executedAt));
};

/**
 * Create a custom workflow
 * @param {Object} config - Workflow configuration
 * @returns {Object} - Created workflow
 */
export const createWorkflow = (config) => {
  return {
    id: `custom_${Date.now()}`,
    name: config.name || 'Custom Workflow',
    description: config.description || '',
    trigger: config.trigger || { type: TRIGGER_TYPES.CLIENT_CREATED, conditions: [] },
    actions: config.actions || [],
    active: config.active !== undefined ? config.active : true,
    createdAt: new Date().toISOString()
  };
};

/**
 * Validate workflow configuration
 * @param {Object} workflow - Workflow to validate
 * @returns {Object} - Validation result
 */
export const validateWorkflow = (workflow) => {
  const errors = [];

  if (!workflow.name || workflow.name.trim() === '') {
    errors.push('Workflow name is required');
  }

  if (!workflow.trigger || !workflow.trigger.type) {
    errors.push('Workflow trigger is required');
  }

  if (!workflow.actions || workflow.actions.length === 0) {
    errors.push('At least one action is required');
  }

  workflow.actions?.forEach((action, index) => {
    if (!action.type) {
      errors.push(`Action ${index + 1}: Action type is required`);
    }
    if (!action.config) {
      errors.push(`Action ${index + 1}: Action configuration is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};
