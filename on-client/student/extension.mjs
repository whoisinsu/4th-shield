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
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('section');
      root.className = 'student-decision';

      const make = (tag, text, className) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        node.textContent = text;
        return node;
      };
      const target = typeof appId === 'string' && appId.length > 0 ? appId : '확인 불가';

      if (mode === 'demo') root.append(make('p', '연결 모드: 예제 자료', 'state state-empty'));
      else if (mode === 'disconnected') root.append(make('p', '연결 모드: 연결 없음', 'state state-empty'));
      else if (mode === 'unknown') root.append(make('p', '연결 모드: 확인 불가', 'state state-empty'));

      if (status === 'idle') {
        root.append(make('p', '업무 앱을 골라 접속을 요청하세요. 아직 요청한 앱이 없습니다.'));
        return root;
      }
      root.append(make('p', `대상 앱: ${target}`));
      if (status === 'loading') {
        root.append(make('p', '판정 확인 중…', 'state state-loading'));
        return root;
      }
      if (status === 'error') {
        // 요청 실패는 서버의 접근 거부 판정이 아니다. 허용으로도 읽히지 않게 따로 표시한다.
        const message = typeof error?.message === 'string' && error.message.length > 0
          ? error.message
          : '서버가 오류 내용을 제공하지 않았습니다.';
        root.append(make('p', `요청 실패: ${message}`, 'state state-error'));
        root.append(make('p', '접근 거부(deny) 판정이 아닙니다. 서버의 판정을 받지 못했으므로 허용되지 않은 것으로 취급하세요. 필요하면 다시 요청하세요.'));
        return root;
      }
      if (status !== 'ok') {
        root.append(make('p', '확인 불가(unknown): 요청 상태를 확인할 수 없습니다. 허용되지 않은 것으로 취급하세요.', 'state state-empty'));
        return root;
      }
      // 네 판정은 글자와 원래 코드값으로 구분한다. 목록에 없는 값은 확인 불가로 본다.
      const decisions = {
        allow: { label: '접근 허용(allow)', className: 'state state-ok', note: '정책상 접근이 허용됐습니다. 실제 앱 접속 성공을 보장하지는 않습니다.' },
        deny: { label: '접근 거부(deny)', className: 'state state-error', note: '서버가 이 앱 접근을 거부했습니다.' },
        challenge: { label: '추가 확인 필요(challenge)', className: 'state state-loading', note: '추가 인증 또는 확인이 필요합니다. 이 앱이 확인 절차를 대신 수행하지 않습니다. 확인 전에는 허용되지 않은 상태입니다.' },
        unknown: { label: '확인 불가(unknown)', className: 'state state-empty', note: '서버 판정을 확인할 수 없습니다. 허용되지 않은 것으로 취급하세요.' },
      };
      const code = data?.decision;
      const known = typeof code === 'string' && Object.hasOwn(decisions, code);
      const decision = known ? decisions[code] : decisions.unknown;
      root.append(make('p', `판정: ${decision.label}`, decision.className));
      if (!known) root.append(make('p', `서버가 보낸 판정 값: ${typeof code === 'string' && code.length > 0 ? code : '없음'}`));
      root.append(make('p', decision.note));

      const reason = typeof data?.reason === 'string' && data.reason.length > 0 ? data.reason : '판정 이유 정보 없음';
      root.append(make('p', `판정 이유: ${reason}`));
      const time = typeof data?.checkedAt === 'string' ? new Date(data.checkedAt) : null;
      const checkedAt = time && !Number.isNaN(time.getTime())
        ? `${time.toLocaleString('ko-KR')} (${data.checkedAt})`
        : '판정 시각 정보 없음';
      root.append(make('p', `판정 시각: ${checkedAt}`));
      return root;
    },
    renderEvents({ status, mode, data, error } = {}) {
      // 호출마다 새 요소를 만든다. 새 자료가 오면 이전 목록·필터·상세가 모두 사라지고 처음부터 다시 그려진다.
      const root = document.createElement('section');
      root.className = 'student-events';

      const make = (tag, text, className) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
      };
      const kindLabel = (kind) => ({ access: '접속 기록', xdr: 'XDR 경보' })[kind] ?? '종류 확인 불가';
      const appLabel = (appId) => typeof appId === 'string' && appId.length > 0 ? appId : '앱 확인 불가(appId 없음)';
      const timeLabel = (at) => {
        const time = typeof at === 'string' ? new Date(at) : null;
        return time && !Number.isNaN(time.getTime()) ? `${time.toLocaleString('ko-KR')} (${at})` : '시각 확인 불가';
      };

      if (mode === 'demo') root.append(make('p', '연결 모드: 예제 자료', 'state state-empty'));
      else if (mode === 'disconnected') root.append(make('p', '연결 모드: 연결 없음', 'state state-empty'));
      else if (mode === 'unknown') root.append(make('p', '연결 모드: 확인 불가', 'state state-empty'));

      if (status === 'loading') {
        root.append(make('p', '기록 불러오는 중…', 'state state-loading'));
        return root;
      }
      if (status === 'error') {
        // 실패 화면에는 이전 목록을 그리지 않는다. 빈 목록 문구와도 다르게 적는다.
        const message = typeof error?.message === 'string' && error.message.length > 0
          ? error.message
          : '서버가 오류 내용을 제공하지 않았습니다.';
        const unverified = ['CONTRACT_MISMATCH', 'ENGINE_RESULT_UNVERIFIED'].includes(error?.code);
        root.append(make('p', unverified
          ? `확인 불가: 기록 형식을 확인할 수 없습니다. ${message}`
          : `기록을 불러오지 못했습니다: ${message}`, 'state state-error'));
        root.append(make('p', '이전 목록은 표시하지 않습니다. 기록이 없다는 뜻이 아닙니다.'));
        return root;
      }
      if (status !== 'ok' || !Array.isArray(data)) {
        root.append(make('p', '확인 불가: 기록 응답 상태를 확인할 수 없습니다.', 'state state-empty'));
        return root;
      }

      root.append(make('p', '내 최근 보안 기록만 표시합니다. 전체 로그나 다른 직원의 기록이 아니며, XDR 경보는 서버에 이미 저장된 경보입니다.', 'muted'));
      if (data.length === 0) {
        root.append(make('p', '표시할 기록이 없습니다.', 'state state-empty'));
        return root;
      }

      // 받은 배열을 복사해 at 기준 최신순으로 정렬한다. 원본 배열은 바꾸지 않는다.
      const timeOf = (event) => {
        const value = Date.parse(event?.at);
        return Number.isFinite(value) ? value : -Infinity;
      };
      const events = [...data].sort((a, b) => timeOf(b) - timeOf(a));

      // 필터 상태는 이 화면 요소 안에서만 기억한다. 전체는 all, 나머지는 받은 원래 값이다.
      const filters = { kind: 'all', appId: 'all', access: 'all' };
      const accessLabel = (access) => ({ allowed: '허용됨', denied: '거부됨', unknown: '확인 불가' })[access] ?? '확인 불가';
      const appValue = (event) => typeof event?.appId === 'string' ? event.appId : '';
      const uniqueValues = (pick) => [...new Set(events.map(pick).filter((value) => typeof value === 'string'))];
      const filterId = `student-events-filter-${Math.random().toString(36).slice(2, 8)}`;

      const filterBox = make('div', null, 'student-events-filters');
      const addFilter = (key, labelText, values, optionLabel) => {
        const id = `${filterId}-${key}`;
        const label = make('label', labelText);
        label.htmlFor = id;
        const select = document.createElement('select');
        select.id = id;
        select.setAttribute('aria-label', labelText);
        const all = make('option', '전체 (all)');
        all.value = 'all';
        select.append(all);
        for (const value of values) {
          const option = make('option', optionLabel(value));
          option.value = value;
          select.append(option);
        }
        select.addEventListener('change', () => {
          filters[key] = select.value;
          renderList();
        });
        filterBox.append(label, select);
      };
      addFilter('kind', '기록 종류', uniqueValues((event) => event?.kind), (value) => `${kindLabel(value)} (${value})`);
      addFilter('appId', '업무 앱', uniqueValues(appValue), (value) => value === '' ? '앱 확인 불가(appId 없음)' : value);
      addFilter('access', '접속 상태', uniqueValues((event) => event?.state?.access), (value) => `${accessLabel(value)} (${value})`);
      root.append(filterBox);

      const matches = (event) => (filters.kind === 'all' || event?.kind === filters.kind)
        && (filters.appId === 'all' || appValue(event) === filters.appId)
        && (filters.access === 'all' || event?.state?.access === filters.access);

      const count = make('p', null, 'student-events-count');
      const list = make('ul', null, 'app-list');
      const detail = make('div', null, 'student-events-detail');
      detail.setAttribute('aria-live', 'polite');
      root.append(count, list, detail);

      // 상세 선택도 이 화면 요소 안에서만 기억한다. 다시 불러오면 새 요소가 만들어져 선택이 초기화된다.
      let selectedId = null;
      const sessionLabel = (value) => ({ active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' })[value] ?? '확인 불가';
      const deviceLabel = (value) => ({ compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' })[value] ?? '확인 불가';
      const stateClass = (value) => {
        if (value === 'allowed' || value === 'active' || value === 'compliant') return undefined;
        if (value === 'denied' || value === 'expired' || value === 'revoked' || value === 'noncompliant') return 'state state-error';
        return 'state state-empty';
      };
      const rawValue = (value) => typeof value === 'string' && value.length > 0 ? value : 'unknown';
      const textEntries = (title, entries) => {
        const block = make('div', null, 'event-block');
        block.append(make('h4', title));
        if (!Array.isArray(entries) || entries.length === 0) {
          block.append(make('p', `${title} 없음`, 'muted'));
          return block;
        }
        const items = make('ul');
        for (const entry of entries) items.append(make('li', `${entry?.id ?? 'ID 없음'}: ${entry?.text ?? '내용 없음'}`));
        block.append(items);
        return block;
      };
      const renderDetail = () => {
        detail.replaceChildren();
        const event = events.find((row) => String(row?.id) === selectedId && matches(row));
        if (!event) {
          selectedId = null;
          return;
        }
        const box = make('section', null, 'event');
        box.dataset.studentEventDetail = String(event.id);
        box.append(make('h3', `${event.id} 상세`));
        box.append(make('p', `사건 ID: ${event.id}`));
        box.append(make('p', `앱: ${appLabel(event.appId)}`));
        box.append(textEntries('근거(evidence)', event.evidence));
        box.append(textEntries('규칙(rules)', event.rules));
        const access = rawValue(event.state?.access);
        const session = rawValue(event.state?.session);
        const device = rawValue(event.state?.device);
        box.append(make('h4', '상태(state)'));
        box.append(make('p', `접속 상태(access): ${accessLabel(access)}(${access})`, stateClass(access)));
        box.append(make('p', `세션 상태(session): ${sessionLabel(session)}(${session})`, stateClass(session)));
        box.append(make('p', `기기 상태(device): ${deviceLabel(device)}(${device})`, stateClass(device)));
        detail.append(box);
      };

      const renderList = () => {
        list.replaceChildren();
        const visible = events.filter(matches);
        if (visible.length === 0) list.append(make('li', '선택한 필터에 맞는 기록이 없습니다.', 'state state-empty'));
        for (const event of visible) {
          const item = make('li', null, 'event');
          item.dataset.studentEventId = String(event?.id ?? '');
          item.append(make('p', `사건 ID: ${event?.id ?? '확인 불가'}`));
          item.append(make('p', `시각: ${timeLabel(event?.at)}`));
          item.append(make('p', `종류: ${kindLabel(event?.kind)} (${event?.kind ?? 'unknown'})`));
          item.append(make('p', `앱: ${appLabel(event?.appId)}`));
          item.append(make('p', `요약: ${typeof event?.summary === 'string' && event.summary ? event.summary : '요약 없음'}`));
          const button = make('button', `${event?.id ?? '확인 불가'} 상세`, 'btn');
          button.type = 'button';
          button.setAttribute('aria-label', `${event?.id ?? '확인 불가'} 상세`);
          button.addEventListener('click', () => {
            selectedId = String(event?.id);
            renderDetail();
          });
          item.append(button);
          list.append(item);
        }
        count.textContent = `표시 중인 기록: ${visible.length}건 (받은 기록 ${events.length}건)`;
        // 필터로 선택한 기록이 목록에서 빠지면 상세도 지운다.
        renderDetail();
      };
      renderList();
      return root;
    },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
