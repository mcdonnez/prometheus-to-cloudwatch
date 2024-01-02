export const multipleHistogramMetrics = `
# HELP temporal_activity_execution_latency temporal_activity_execution_latency
# TYPE temporal_activity_execution_latency histogram
temporal_activity_execution_latency_bucket{activity_type="compareProjects",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="50"} 2
temporal_activity_execution_latency_bucket{activity_type="compareProjects",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="100"} 2
temporal_activity_execution_latency_bucket{activity_type="compareProjects",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="500"} 2
temporal_activity_execution_latency_bucket{activity_type="compareProjects",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="1000"} 2
temporal_activity_execution_latency_bucket{activity_type="compareProjects",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="5000"} 2
temporal_activity_execution_latency_bucket{activity_type="compareProjects",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="10000"} 2
temporal_activity_execution_latency_bucket{activity_type="compareProjects",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="60000"} 2
temporal_activity_execution_latency_bucket{activity_type="compareProjects",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="+Inf"} 2
temporal_activity_execution_latency_sum{activity_type="compareProjects",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById"} 28
temporal_activity_execution_latency_count{activity_type="compareProjects",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById"} 2
temporal_activity_execution_latency_bucket{activity_type="evaluateTriggers",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="50"} 0
temporal_activity_execution_latency_bucket{activity_type="evaluateTriggers",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="100"} 2
temporal_activity_execution_latency_bucket{activity_type="evaluateTriggers",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="500"} 2
temporal_activity_execution_latency_bucket{activity_type="evaluateTriggers",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="1000"} 2
temporal_activity_execution_latency_bucket{activity_type="evaluateTriggers",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="5000"} 2
temporal_activity_execution_latency_bucket{activity_type="evaluateTriggers",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="10000"} 2
temporal_activity_execution_latency_bucket{activity_type="evaluateTriggers",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="60000"} 2
temporal_activity_execution_latency_bucket{activity_type="evaluateTriggers",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById",le="+Inf"} 2
temporal_activity_execution_latency_sum{activity_type="evaluateTriggers",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById"} 113
temporal_activity_execution_latency_count{activity_type="evaluateTriggers",namespace="default",service_name="temporal-core-sdk",task_queue="dev_integrations_priority_queue",workflow_type="syncProjectById"} 2
`;
