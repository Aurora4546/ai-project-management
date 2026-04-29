package com.projectmanagement.pmanage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnreadCountsResponse {
    private Map<UUID, Long> projects; // projectId -> general channel count
    private Map<UUID, Map<Long, Long>> dms; // projectId -> (peerUserId -> count)
}
