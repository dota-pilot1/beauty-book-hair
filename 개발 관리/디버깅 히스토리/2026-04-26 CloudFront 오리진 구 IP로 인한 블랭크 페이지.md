# CloudFront 오리진 구 IP로 인한 블랭크 페이지

**날짜**: 2026-04-26  
**증상**: `dxline-tallent.com` 접속 시 내비게이션만 보이고 콘텐츠 없는 블랭크 페이지

---

## 원인

EC2 탄력적 IP를 새로 할당(`13.124.117.243` → `13.209.195.64`)했을 때 CloudFront 오리진 설정이 구 IP 기반 EC2 DNS 호스트명을 그대로 가리키고 있었음.

| 항목 | 값 |
|------|-----|
| 구 오리진 | `ec2-13-124-117-243.ap-northeast-2.compute.amazonaws.com` |
| 신 오리진 | `ec2-13-209-195-64.ap-northeast-2.compute.amazonaws.com` |

구 DNS가 더 이상 해당 인스턴스를 가리키지 않아 `/api/*` 경유 백엔드 요청이 전부 실패 → 프론트에서 데이터 없이 빈 화면 렌더링.

---

## 해결

```bash
# 현재 CloudFront 오리진 확인
aws cloudfront get-distribution --id E11NF3HMOB52NI \
  --query 'Distribution.DistributionConfig.Origins.Items[*].{Id:Id,Domain:DomainName}'

# config 다운로드 → 오리진 도메인 수정 → 업데이트
aws cloudfront get-distribution-config --id E11NF3HMOB52NI > /tmp/cf-config.json
# DomainName 수정 후
aws cloudfront update-distribution \
  --id E11NF3HMOB52NI \
  --distribution-config file:///tmp/cf-updated.json \
  --if-match <ETag>
```

**주의**: CloudFront 오리진에 IP 주소 직접 입력 불가 → EC2 DNS 호스트명 형식 사용  
→ `ec2-<IP-대시구분>.ap-northeast-2.compute.amazonaws.com`

---

## 재발 방지

- EC2 IP 변경(탄력적 IP 재할당) 시 반드시 CloudFront 오리진도 함께 업데이트
- 탄력적 IP 고정 사용 권장 — IP 바뀌면 CloudFront, `.env.production` 양쪽 모두 수정 필요
