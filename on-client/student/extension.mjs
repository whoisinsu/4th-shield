// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('section');
      root.className = 'student-identity';

      const make = (tag, text, className) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        node.textContent = text;
        return node;
      };
      const value = (input) => typeof input === 'string' && input.length > 0 ? input : '확인 불가';
      const modeLabel = (resource) => {
        const mode = resource?.mode ?? resource?.meta?.mode ?? 'unknown';
        if (mode === 'demo') return '예제 자료';
        if (mode === 'disconnected') return '연결 없음';
        if (mode === 'connected') return '연결됨';
        return '확인 불가';
      };
      const addSection = (title, resource) => {
        const section = document.createElement('section');
        section.append(make('h3', title));
        section.append(make('p', `연결 모드: ${modeLabel(resource)}`, 'student-identity-mode'));
        root.append(section);
        return section;
      };
      const addFailure = (section, resource) => {
        const error = resource?.error;
        const message = typeof error?.message === 'string' && error.message.length > 0
          ? error.message
          : '서버가 오류 내용을 제공하지 않았습니다.';
        const unverified = ['CONTRACT_MISMATCH', 'ENGINE_RESULT_UNVERIFIED'].includes(error?.code);
        section.append(make('p', `${unverified ? '확인 불가' : '연결 실패'}: ${message}`, 'student-identity-error state state-error'));
      };
      const addResourceState = (section, resource, renderData) => {
        if (resource?.status === 'loading') {
          section.append(make('p', '불러오는 중', 'student-identity-loading'));
        } else if (resource?.status === 'error') {
          addFailure(section, resource);
        } else if (resource?.status === 'ok') {
          renderData(section, resource.data);
        } else {
          section.append(make('p', '확인 불가: 응답 상태를 확인할 수 없습니다.', 'state state-empty'));
        }
      };
      const deviceStatus = (status) => ({
        compliant: '보안 기준 충족 (compliant)',
        noncompliant: '보안 기준 미충족 (noncompliant)',
        unknown: '확인 불가 (unknown)',
      })[status] ?? `확인 불가 (${value(status)})`;
      const sessionStatus = (status) => ({
        active: '활성 (active)',
        expired: '만료 (expired)',
        revoked: '철회됨 (revoked)',
        unknown: '확인 불가 (unknown)',
      })[status] ?? `확인 불가 (${value(status)})`;
      // 정상이 아닌 상태는 글자와 함께 제공 CSS 상태 색으로도 구분한다.
      const statusClass = (status) => {
        if (status === 'compliant' || status === 'active') return undefined;
        if (status === 'noncompliant' || status === 'expired' || status === 'revoked') return 'state state-error';
        return 'state state-empty';
      };

      const identitySection = addSection('로그인 계정·현재 기기·세션', me);
      addResourceState(identitySection, me, (section, data) => {
        const user = data?.user;
        const device = data?.device;
        const session = data?.session;
        if (!user || !device || !session) {
          section.append(make('p', '확인 불가: 로그인·기기·세션 응답 형식을 확인할 수 없습니다.', 'state state-empty'));
          return;
        }
        section.append(make('p', `사용자 이름: ${value(user.label)}`));
        section.append(make('p', `사용자 ID: ${value(user.id)}`));
        section.append(make('p', `현재 기기 이름: ${value(device.label)}`));
        section.append(make('p', `현재 기기 ID: ${value(device.id)}`));
        section.append(make('p', `현재 기기 보안 상태: ${deviceStatus(device.status)}`, statusClass(device.status)));
        section.append(make('p', `세션 ID: ${value(session.id)}`));
        section.append(make('p', `세션 상태: ${sessionStatus(session.status)}`, statusClass(session.status)));
      });

      const devicesSection = addSection('기기 목록', devices);
      addResourceState(devicesSection, devices, (section, data) => {
        if (!Array.isArray(data)) {
          section.append(make('p', '확인 불가: 기기 목록 형식을 확인할 수 없습니다.', 'state state-empty'));
          return;
        }
        if (data.length === 0) {
          section.append(make('p', '등록된 기기가 없습니다.'));
          return;
        }
        const list = document.createElement('ul');
        for (const device of data) {
          const item = document.createElement('li');
          item.textContent = `기기 이름: ${value(device?.label)} · 기기 ID: ${value(device?.id)} · 보안 상태: ${deviceStatus(device?.status)}`;
          const deviceClass = statusClass(device?.status);
          if (deviceClass) item.className = deviceClass;
          list.append(item);
        }
        section.append(list);
      });

      const sessionsSection = addSection('세션 목록', sessions);
      addResourceState(sessionsSection, sessions, (section, data) => {
        if (!Array.isArray(data)) {
          section.append(make('p', '확인 불가: 세션 목록 형식을 확인할 수 없습니다.', 'state state-empty'));
          return;
        }
        if (data.length === 0) {
          section.append(make('p', '표시할 세션이 없습니다.'));
          return;
        }
        const list = document.createElement('ul');
        for (const session of data) {
          const item = document.createElement('li');
          item.textContent = `세션 ID: ${value(session?.id)} · 세션 상태: ${sessionStatus(session?.status)}`;
          const sessionClass = statusClass(session?.status);
          if (sessionClass) item.className = sessionClass;
          list.append(item);
        }
        section.append(list);
      });

      return root;
    },
    renderDecision() { return '학생 구현 대기: 서버의 판정과 이유를 연결하세요.'; },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
