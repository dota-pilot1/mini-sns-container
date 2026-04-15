package com.cj.stayops.backend.auth.infrastructure.security;

import com.cj.stayops.backend.user.domain.model.Email;
import com.cj.stayops.backend.user.domain.model.UserId;

/**
 * JWT 검증 결과로부터 복원한 인증 principal.
 * <p>
 * Spring Security {@code SecurityContext} 의 principal 자리에 이 값을 꽂을 수 있도록
 * 가벼운 래퍼로 둔다. 실제 {@code Authentication} 구현은 step5 의 필터에서 조립.
 */
public record JwtAuthentication(UserId userId, Email email) {
}
