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
        // 학생 화면에는 연결된 조치가 없다. 조치가 넘어온 경우에만 요청을 보내지 않는 비활성 안내 버튼을 둔다.
        const actions = Array.isArray(event.supportedActions)
          ? event.supportedActions.filter((action) => typeof action === 'string' && action.length > 0)
          : [];
        if (actions.length > 0) {
          box.append(make('h4', '조치'));
          box.append(make('p', '조치 실행 연결은 준비 중입니다. 아래 조치는 아직 지원하지 않으며, 버튼은 비활성 상태라 어떤 요청도 보내지 않습니다.', 'state state-empty'));
          const actionBox = make('div', null, 'event-actions');
          for (const action of actions) {
            const button = make('button', `${action} 미지원`, 'btn');
            button.type = 'button';
            button.disabled = true;
            button.setAttribute('aria-label', `${action} 미지원`);
            actionBox.append(button);
          }
          box.append(actionBox);
        }
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
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      // 호출마다 새 요소를 만든다. 다시 불러와 성공하면 이전 실패 안내는 남지 않는다.
      // 자동 재요청은 하지 않는다. 다시 시도는 사용자가 버튼을 직접 누를 때만 일어난다.
      const root = document.createElement('section');
      root.className = 'student-status';

      const make = (tag, text, className) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
      };
      const failureText = (name, error) => {
        const message = typeof error?.message === 'string' && error.message.length > 0
          ? error.message
          : '서버가 오류 내용을 제공하지 않았습니다.';
        const code = typeof error?.code === 'string' ? error.code : '';
        if (code.includes('TIMEOUT')) return `${name}: 시간 초과로 불러오지 못했습니다(${code}). ${message}`;
        if (code === 'CONTRACT_MISMATCH' || code === 'ENGINE_RESULT_UNVERIFIED') return `${name}: 확인 불가. 응답 형식을 확인할 수 없습니다. ${message}`;
        return `${name}: 불러오지 못했습니다. ${message}`;
      };
      const RETRY_HINT = '다시 시도는 위쪽 「다시 불러오기」 버튼을 직접 누르세요. 자동으로 다시 요청하지 않습니다.';
      const deviceLabel = (value) => ({ compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' })[value] ?? '확인 불가';
      const sessionLabel = (value) => ({ active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' })[value] ?? '확인 불가';
      const stateClass = (value) => {
        if (value === 'compliant' || value === 'active') return undefined;
        if (value === 'noncompliant' || value === 'expired' || value === 'revoked') return 'state state-error';
        return 'state state-empty';
      };
      const rawValue = (value) => typeof value === 'string' && value.length > 0 ? value : 'unknown';

      if (mode === 'demo') root.append(make('p', '연결 모드: 예제 자료', 'state state-empty'));
      else if (mode === 'disconnected') root.append(make('p', '연결 모드: 연결 없음', 'state state-empty'));
      else if (mode === 'unknown') root.append(make('p', '연결 모드: 확인 불가', 'state state-empty'));

      // 기기·세션 목록: 불러오는 중 / 빈 목록 / 실패 / 목록을 서로 다른 문장으로 보여 준다.
      const addList = ({ title, name, resource, empty, note, describe }) => {
        const section = make('section');
        section.append(make('h3', title));
        if (note) section.append(make('p', note, 'muted'));
        if (!resource || resource.status === 'loading') {
          section.append(make('p', `${name} 불러오는 중…`, 'state state-loading'));
        } else if (resource.status === 'error') {
          section.append(make('p', failureText(name, resource.error), 'state state-error'));
          section.append(make('p', RETRY_HINT));
        } else if (resource.status !== 'ok' || !Array.isArray(resource.data)) {
          section.append(make('p', `${name}: 확인 불가. 응답 상태를 확인할 수 없습니다.`, 'state state-empty'));
        } else if (resource.data.length === 0) {
          section.append(make('p', empty, 'state state-empty'));
        } else {
          const list = make('ul');
          for (const row of resource.data) {
            const { text, status } = describe(row);
            list.append(make('li', text, stateClass(status)));
          }
          section.append(list);
        }
        root.append(section);
      };
      addList({
        title: '내 기기',
        name: '기기 목록',
        resource: devices,
        empty: '등록된 기기가 없습니다.',
        describe: (row) => {
          const status = rawValue(row?.status);
          return { status, text: `${row?.label ?? '이름 없음'} (${row?.id ?? 'ID 없음'}) · ${deviceLabel(status)}(${status})` };
        },
      });
      addList({
        title: '현재 세션',
        name: '세션',
        resource: sessions,
        empty: '현재 연결 없음: 검증된 세션이 없습니다.',
        note: '세션은 지금 검증된 연결 하나만 표시합니다. 지난 세션 전체 목록이 아닙니다.',
        describe: (row) => {
          const status = rawValue(row?.status);
          return { status, text: `세션 ${row?.id ?? 'ID 없음'} · ${sessionLabel(status)}(${status})` };
        },
      });

      // 알림: 항목마다 어느 자료(resource)인지, code, message를 글자로 보여 준다.
      const resourceLabel = (value) => ({
        me: '로그인 정보', apps: '업무 앱', events: '보안 기록', devices: '기기', sessions: '세션',
        access: '접속 판정', diagnostics: '도움정보', vulnerabilities: '설치 패키지 조회',
      })[value] ?? '자료 확인 불가';
      const noticeSection = make('section');
      noticeSection.append(make('h3', '알림'));
      if (!Array.isArray(notifications)) {
        noticeSection.append(make('p', '알림: 확인 불가. 알림 목록을 확인할 수 없습니다.', 'state state-empty'));
      } else if (notifications.length === 0) {
        noticeSection.append(make('p', '주의할 알림이 없습니다.', 'state state-empty'));
      } else {
        noticeSection.append(make('p', `주의할 알림 ${notifications.length}건`));
        const list = make('ul');
        for (const notice of notifications) {
          const resource = typeof notice?.resource === 'string' ? notice.resource : 'unknown';
          const code = typeof notice?.code === 'string' && notice.code.length > 0 ? notice.code : '코드 없음';
          const message = typeof notice?.message === 'string' && notice.message.length > 0 ? notice.message : '내용 없음';
          list.append(make('li', `자료: ${resourceLabel(resource)}(${resource}) · 코드: ${code} · 내용: ${message}`, 'state state-error'));
        }
        noticeSection.append(list);
      }
      root.append(noticeSection);

      // 도움정보: 제공 화면이 조회해 넘겨준 결과만 쓴다. 학생 코드는 /api/diagnostics를 직접 호출하지 않는다.
      const diagSection = make('section');
      diagSection.append(make('h3', '도움정보'));
      if (!diagnostics || diagnostics.status === 'idle') {
        diagSection.append(make('p', '아직 도움정보를 불러오지 않았습니다. 위 도움정보 칸의 「도움정보 불러오기」를 직접 누르세요.', 'state state-empty'));
      } else if (diagnostics.status === 'loading') {
        diagSection.append(make('p', '도움정보 불러오는 중…', 'state state-loading'));
      } else if (diagnostics.status === 'error') {
        diagSection.append(make('p', failureText('도움정보', diagnostics.error), 'state state-error'));
        diagSection.append(make('p', '다시 시도는 위 도움정보 칸의 「도움정보 불러오기」를 직접 누르세요. 자동으로 다시 요청하지 않습니다.'));
      } else if (diagnostics.status !== 'ok') {
        diagSection.append(make('p', '도움정보: 확인 불가. 응답 상태를 확인할 수 없습니다.', 'state state-empty'));
      }

      // 진단 결과에서 정해진 6개 값만 고른다. 그 밖의 값과 비밀처럼 보이는 값은 화면·복사 내용에 넣지 않는다.
      const secretLike = /(?:Bearer\s+\S+|sk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|token|password|secret|authorization)\s*[:=])/i;
      const safeValue = (value) => {
        if (typeof value !== 'string' || value.length === 0) return '확인 불가';
        return secretLike.test(value) ? '[비밀값으로 보여 표시하지 않음]' : value.slice(0, 200);
      };
      const data = diagnostics?.status === 'ok' ? diagnostics.data : null;
      const safeFields = data ? [
        ['requestId', safeValue(data.requestId)],
        ['component', safeValue(data.component)],
        ['version', safeValue(data.version)],
        ['checkedAt', safeValue(data.checkedAt)],
        ['engine.mode', safeValue(data.engine?.mode)],
        ['engine.code', safeValue(data.engine?.code)],
      ] : [];
      if (data) {
        const list = make('dl', null, 'kv');
        for (const [name, value] of safeFields) {
          list.append(make('dt', name));
          list.append(make('dd', value));
        }
        diagSection.append(list);
      }

      diagSection.append(make('p', '「도움정보 복사」는 강사나 담당자에게 도움을 요청할 때 붙여 넣도록 위의 6개 값만 클립보드에 복사합니다. 누를 때만 복사하며 어디에도 자동으로 보내지 않습니다.', 'muted'));
      const copyButton = make('button', '도움정보 복사', 'btn');
      copyButton.type = 'button';
      copyButton.setAttribute('aria-label', '도움정보 복사');
      copyButton.disabled = !data;
      const copyStatus = make('p', data ? '' : '도움정보를 불러온 뒤에 복사할 수 있습니다.');
      copyStatus.setAttribute('role', 'status');
      copyButton.addEventListener('click', async () => {
        if (!data) return;
        const text = safeFields.map(([name, value]) => `${name}: ${value}`).join('\n');
        try {
          await navigator.clipboard.writeText(text);
          copyStatus.textContent = '도움정보 6개 값을 클립보드에 복사했습니다. 붙여 넣기 전에 내용을 직접 확인하세요.';
        } catch {
          copyStatus.textContent = '자동 복사를 사용할 수 없습니다. 위에 보이는 6개 값을 직접 선택해 Ctrl+C로 복사하세요.';
        }
      });
      diagSection.append(copyButton, copyStatus);
      root.append(diagSection);

      return root;
    },
    renderVulnerabilities({ status, mode, data, error } = {}) {
      // 호출마다 새 요소를 만든다. 조회 중·오류·취소일 때 이전 표는 남지 않는다.
      // 자동으로 다시 조회하지 않는다. 조회와 취소는 제공 화면 버튼으로만 한다.
      const root = document.createElement('section');
      root.className = 'student-vulnerabilities';

      const make = (tag, text, className) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
      };
      const text = (value) => typeof value === 'string' && value.length > 0 ? value : null;
      const NOT_CLEAN = '조회 실패·미조회는 "취약점 없음"이 아닙니다.';
      const RETRY_HINT = '다시 조회는 위 「설치 패키지 조회」 버튼을 직접 누르세요. 자동으로 다시 조회하지 않습니다.';

      const modeText = { demo: '예제 자료 · 실제 연결 아님', disconnected: '연결 없음', connected: '연결됨' }[mode];
      if (mode != null) root.append(make('p', `연결 모드: ${modeText ?? '확인 불가'}`, 'muted'));

      if (!status || status === 'idle') {
        root.append(make('p', '조회 상태: 조회 전(idle)', 'state state-empty'));
        root.append(make('p', '아직 설치 패키지를 조회하지 않았습니다. 조회는 위 「설치 패키지 조회」 버튼을 직접 누르세요.'));
        return root;
      }
      if (status === 'loading') {
        root.append(make('p', '조회 상태: 조회 중(loading)', 'state state-loading'));
        root.append(make('p', '아직 결과가 없습니다. 이전 조회 결과는 현재 결과로 표시하지 않습니다.'));
        return root;
      }
      if (status !== 'ok') {
        const code = text(error?.code);
        const cancelled = code === 'CANCELLED' || code === 'REQUEST_CANCELLED';
        root.append(make('p', `조회 상태: ${cancelled ? '조회 취소' : '조회 실패'}(${status === 'error' ? 'error' : text(status) ?? 'unknown'})`, 'state state-error'));
        root.append(make('p', `조회 실패: ${text(error?.message) ?? '서버가 오류 내용을 제공하지 않았습니다.'}${code ? ` (${code})` : ''}`));
        root.append(make('p', `${NOT_CLEAN} 이전 조회 결과는 현재 결과로 표시하지 않습니다.`, 'muted'));
        root.append(make('p', RETRY_HINT, 'muted'));
        return root;
      }

      // 전체 조회 상태. 원래 값과 뜻을 함께 쓴다.
      const SCAN = {
        complete: ['모두 조회(complete)', 'state state-ok', '승인된 조회 대상 패키지를 모두 OSV에서 조회했습니다.'],
        partial: ['일부 조회 실패(partial)', 'state state-error', `일부 패키지는 조회하지 못했습니다. ${NOT_CLEAN} 이미 받은 취약점 ID는 그대로 표시합니다.`],
        not_checked: ['아직 조회 안 함(not_checked)', 'state state-empty', `승인된 공개 조회 대상 패키지가 없어 OSV 조회를 하지 않은 미조회 상태입니다. 허용 패키지는 담당자가 준비합니다. ${NOT_CLEAN}`],
        not_configured: ['조회 준비 미완료(not_configured)', 'state state-empty', `조회 대상 프로젝트 설정이 필요한 미조회 상태입니다. 대상 경로는 담당자가 준비하며 학생이 설정을 바꾸지 않습니다. ${NOT_CLEAN}`],
        unverifiable: ['lock 파일 확인 불가(unverifiable)', 'state state-error', `package-lock.json과 설치된 node_modules 메타데이터를 대조할 수 없어 조회하지 않았습니다. ${NOT_CLEAN}`],
      };
      const scan = SCAN[data?.status];
      if (!scan) {
        root.append(make('p', `조회 상태: 확인 불가(${text(data?.status) ?? 'unknown'})`, 'state state-empty'));
        root.append(make('p', `응답의 전체 조회 상태를 확인할 수 없어 결과를 표시하지 않습니다. ${NOT_CLEAN}`));
        return root;
      }
      root.append(make('p', `조회 상태: ${scan[0]}`, scan[1]));
      root.append(make('p', scan[2]));
      if (text(data.code)) root.append(make('p', `상태 코드: ${data.code}`, 'muted'));

      // 전체 결과 기준값. 전달된 값만 쓴다.
      const meta = [['기준', 'package-lock.json과 설치된 node_modules 메타데이터 대조 결과']];
      if (Number.isSafeInteger(data.lockfileVersion)) meta.push(['lockfileVersion', String(data.lockfileVersion)]);
      if (text(data.lockfileHash)) meta.push(['lockfileHash', data.lockfileHash]);
      if (text(data.checkedAt)) meta.push(['전체 조회 시각(checkedAt)', data.checkedAt]);
      const metaList = make('dl', null, 'kv');
      for (const [name, value] of meta) metaList.append(make('dt', name), make('dd', value));
      root.append(metaList);

      // 패키지별 결과. 범위 표기(^1.2.0 등)는 설치 버전으로 표시하지 않는다.
      const EXACT = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
      const packages = Array.isArray(data.packages) ? data.packages : [];
      if (packages.length === 0) {
        root.append(make('p', `표시할 패키지 결과가 없습니다. ${data.status === 'complete' ? '' : NOT_CLEAN}`.trim(), 'state state-empty'));
      } else {
        const table = make('table', null, 'student-vulnerabilities-table');
        table.append(make('caption', '패키지별 OSV 조회 결과'));
        const headRow = make('tr');
        for (const label of ['패키지(name)', '설치 버전(version)', '조회 상태(status)', '취약점 ID · 수정 시각(modified)', '출처(source)', '패키지 조회 시각(checkedAt)']) {
          const th = make('th', label);
          th.scope = 'col';
          headRow.append(th);
        }
        const thead = make('thead');
        thead.append(headRow);
        const tbody = make('tbody');
        for (const pkg of packages) {
          const name = text(pkg?.name);
          const version = text(pkg?.version) && EXACT.test(pkg.version) ? pkg.version : null;
          const findings = Array.isArray(pkg?.vulnerabilities) ? pkg.vulnerabilities : [];
          const row = make('tr');
          if (name) row.dataset.studentPackageName = name;
          if (version) row.dataset.studentPackageVersion = version;

          let statusText;
          let statusClass;
          if (pkg?.status === 'known_vulnerabilities') {
            statusText = '알려진 항목 있음(known_vulnerabilities)';
            statusClass = 'state state-error';
          } else if (pkg?.status === 'none_found') {
            statusText = '알려진 항목 없음(none_found)';
          } else if (pkg?.status === 'unverifiable') {
            statusText = findings.length > 0 ? '일부 확인·전체 조회 확인 불가(unverifiable)' : '조회 확인 불가(unverifiable)';
            statusClass = 'state state-error';
          } else {
            statusText = `확인 불가(${text(pkg?.status) ?? 'unknown'})`;
            statusClass = 'state state-empty';
          }

          const findingCell = make('td');
          if (findings.length > 0) {
            // 일부 조회 실패여도 이미 받은 취약점 ID는 지우지 않는다.
            const list = make('ul');
            for (const finding of findings) {
              list.append(make('li', `${text(finding?.id) ?? '확인 불가'} · 수정 시각 ${text(finding?.modified) ?? '확인 불가'}`));
            }
            findingCell.append(list);
            if (pkg?.status === 'unverifiable') findingCell.append(make('p', '일부만 확인했으며 이 패키지의 전체 조회 결과는 확인할 수 없습니다.', 'muted'));
          } else if (pkg?.status === 'none_found') {
            findingCell.textContent = '조회 범위에서 알려진 항목이 없습니다(안전 보장 아님).';
          } else {
            findingCell.textContent = `조회하지 못함 · ${NOT_CLEAN}`;
          }

          row.append(
            make('td', name ?? '확인 불가'),
            make('td', version ?? `확인 불가(정확한 설치 버전 아님: ${text(pkg?.version) ?? '값 없음'})`, version ? undefined : 'state state-empty'),
            make('td', statusText, statusClass),
            findingCell,
            make('td', text(pkg?.source) ?? '확인 불가'),
            make('td', text(pkg?.checkedAt) ?? '확인 불가'),
          );
          tbody.append(row);
        }
        table.append(thead, tbody);
        root.append(table);
      }
      root.append(make('p', 'OSV는 알려진 취약점 데이터베이스입니다. 조회 결과가 없다는 사실만으로 해당 패키지나 앱 전체가 안전하다고 보장할 수 없습니다.', 'muted'));
      return root;
    },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted } = {}) {
      // 호출마다 새 요소를 만든다. 다시 점검해 성공하거나 idle로 돌아오면 이전 결과·오류 안내는 남지 않는다.
      // 자동으로 다시 점검하지 않는다. 다시 점검은 사용자가 버튼을 직접 누를 때만 일어난다.
      const root = document.createElement('section');
      root.className = 'student-ai-connection';

      const make = (tag, text, className) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
      };
      const RETRY_HINT = '다시 점검은 위 AI 연결 칸의 「현재 API 연결 점검」 버튼을 직접 누르세요. 자동으로 다시 점검하지 않습니다.';
      // 계약상 explanationAccepted는 false다. 연결 점검만으로 사건 설명 완료를 표시하지 않는다.
      const NOT_EXPLAINED = '사건 설명은 아직 실행하지 않았습니다. 이 결과는 AI 연결 점검이며, 사건 설명은 보안 기록에서 따로 요청하고 확인합니다.';

      if (mode === 'demo') root.append(make('p', '연결 모드: 예제 자료', 'state state-empty'));
      else if (mode === 'disconnected') root.append(make('p', '연결 모드: 연결 없음', 'state state-empty'));
      else if (mode === 'unknown') root.append(make('p', '연결 모드: 확인 불가', 'state state-empty'));

      if (!status || status === 'idle') {
        root.append(make('p', 'AI 연결 점검 전', 'state state-empty'));
        root.append(make('p', '계정 연결과 AI 연결 승인을 마친 뒤 「현재 API 연결 점검」을 직접 누르세요.'));
        return root;
      }
      if (status === 'loading') {
        root.append(make('p', 'AI 연결 점검 중…', 'state state-loading'));
        return root;
      }
      if (status === 'ok') {
        const level = data?.audienceAuthorization === 'verified'
          ? '앱 권한 확인 후 점검(verified)'
          : data?.audienceAuthorization === 'test' ? '시험 연결 점검(test)' : '확인 불가(unknown)';
        root.append(make('p', `점검 결과: ${level}`, data?.audienceAuthorization === 'verified' ? 'state state-ok' : 'state state-empty'));
        if (data?.audienceAuthorization === 'test') {
          root.append(make('p', '시험 연결(transport)만 점검했습니다. 실제 게이트의 앱 권한 수용은 아직 확인되지 않았습니다.'));
        }
        const list = make('dl', null, 'kv');
        list.append(make('dt', '응답 모델 수'), make('dd', Number.isInteger(data?.modelCount) ? String(data.modelCount) : '확인 불가'));
        list.append(make('dt', '점검 시각'), make('dd', typeof checkedAt === 'string' && checkedAt ? checkedAt : '확인 불가'));
        root.append(list);
        root.append(make('p', NOT_EXPLAINED, 'state state-empty'));
        return root;
      }

      // 오류: 안전한 code·message만 쓰고, 코드가 알려 주는 범위 안에서 원인과 다음 행동을 안내한다.
      const secretLike = /(?:Bearer\s+\S+|sk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|token|password|secret|authorization|credential|client[_ -]?secret)\s*[:=]\s*[^\s,;]+|\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:\+?\d[\d .()-]{7,}\d)\b)/gi;
      const safeText = (value, fallback) => {
        if (typeof value !== 'string' || value.length === 0) return fallback;
        return value
          .replace(secretLike, '[비밀값 또는 개인정보 가림]')
          .slice(0, 300);
      };
      const code = safeText(error?.code, 'AI_REQUEST_UNVERIFIED');
      const message = safeText(error?.message, '서버가 오류 내용을 제공하지 않았습니다.');
      const causes = [
        { codes: ['ON_AI_PROVISIONING_PENDING', 'ON_AI_AUTHORIZATION_CHANGED', 'SUBJECT_SCOPE_UNVERIFIED', 'AI_REQUEST_UNVERIFIED'],
          title: '권한 준비 중·확인 불가', guide: '담당자에게 계정 연결과 앱 권한 확인을 요청하세요. 운영 측 권한 준비가 끝나야 연결되며, 학생 코드의 잘못이 아닙니다.' },
        { codes: ['WB_CLCO_AUTH_REQUIRED'], title: '인증 실패', guide: '보호 현황의 계정 연결을 다시 확인하고, 계속되면 담당자에게 확인하세요. 열쇠를 복사해 붙이지 마세요.' },
        { codes: ['WB_CLCO_ACCESS_BLOCKED'], title: '접근 제한', guide: '계정 연결을 다시 확인하고, 담당자에게 앱 이용 권한을 확인하세요.' },
        { codes: ['WB_CLCO_COHORT_BUDGET_EXHAUSTED', 'WB_CLCO_LIMIT_REACHED'], title: '사용량·이용 한도', guide: '반 사용량이나 이용 한도에 도달했습니다. 담당자에게 확인하세요.' },
        { codes: ['WB_CLCO_SESSION_CLOSED'], title: '이용 시간 아님', guide: '현재 AI 이용 시간이 아닙니다. 이용 시간을 확인하세요.' },
        { codes: ['WB_CLCO_RATE_LIMITED', 'WB_CLCO_TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT', 'TIMEOUT', 'NETWORK_ERROR'],
          title: '요청 제한·시간 초과·네트워크', guide: '잠시 뒤 직접 다시 점검하세요.' },
        { codes: ['WB_CLCO_CANCELLED', 'CANCELLED', 'REQUEST_CANCELLED'], title: '취소됨', guide: '점검을 취소했습니다. 이전 결과는 현재 결과가 아닙니다.' },
        { codes: ['MODEL_NOT_CONFIGURED', 'ON_AI_MODEL_LIST_EMPTY'], title: '쓸 수 있는 모델 없음', guide: '담당자에게 모델 허용 설정 확인을 요청하세요.' },
        { codes: ['ON_AI_INVALID_INPUT', 'ON_AI_INVALID_OUTPUT'], title: '응답 확인 불가', guide: 'AI 응답 형식을 확인할 수 없습니다. 연결 성공으로 보지 마세요.' },
      ];
      const cause = causes.find((row) => row.codes.includes(code));
      const title = cause?.title ?? '원인 확인 불가';
      const guide = cause?.guide ?? '화면 문구에서 키·토큰·비밀번호·개인정보를 가린 뒤, 그 문구와 시각, 반 이름을 과제 운영 SKT 담당자에게 보내 주세요.';
      root.append(make('p', `AI 연결 점검 실패: ${title}`, cause?.title === '취소됨' ? 'state state-empty' : 'state state-error'));
      root.append(make('p', `오류 코드: ${code}`));
      root.append(make('p', `내용: ${message}`));
      root.append(make('p', `안내: ${guide}`));
      root.append(make('p', RETRY_HINT));
      root.append(make('p', '연결 점검이 실패했으므로 사건 설명도 실행하지 않았습니다.', 'muted'));
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      // 호출마다 새 요소를 만든다. 다른 기록 선택·다시 불러오기·실패 때 이전 설명과 성공 표식은 남지 않는다.
      // 성공 표식(data-student-explanation-event)은 근거가 이 기록과 맞는 성공한 설명에만 붙인다.
      const root = document.createElement('section');
      root.className = 'student-explanation';

      const make = (tag, text, className) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
      };
      const eventId = typeof event?.id === 'string' && event.id ? event.id : null;
      const status = explanation?.status;
      const safeErrorText = (value, fallback) => {
        if (typeof value !== 'string' || value.length === 0) return fallback;
        const secretLike = /(?:Bearer\s+\S+|sk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|token|password|secret|authorization|credential|client[_ -]?secret)\s*[:=]\s*[^\s,;]+|\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:\+?\d[\d .()-]{7,}\d)\b)/gi;
        return value.replace(secretLike, '[비밀값 또는 개인정보 가림]').slice(0, 300);
      };

      const KEEP_RECORDS = '기록은 그대로입니다. 업무 앱 판정과 보안 기록은 계속 쓸 수 있으며, AI 설명 실패는 과제 실패가 아닙니다. 다시 요청은 보안 기록에서 「AI 설명 요청」을 직접 누르세요.';
      // 실패 화면에는 성공 표식(data-student-explanation-event)을 붙이지 않는다.
      const renderFailure = (title, code, message, reason) => {
        root.append(make('p', `사건 ID: ${eventId ?? '확인 불가'}`));
        root.append(make('p', `AI 설명 실패: ${title}`, 'state state-error'));
        root.append(make('p', `오류 코드: ${code}`));
        root.append(make('p', `내용: ${message}`));
        if (reason) root.append(make('p', `실패 이유: ${reason}`));
        root.append(make('p', KEEP_RECORDS));
        return root;
      };
      const failureReason = (code) => ({
        ON_AI_INVALID_INPUT: '설명에 필요한 근거·규칙이 부족하거나 확인할 수 없습니다.',
        ON_AI_INVALID_OUTPUT: 'AI 설명의 근거 ID·조치·응답 형식이 기록과 맞지 않거나, 이미 실행했다고 답한 설명이라 쓸 수 없습니다.',
        SUBJECT_SCOPE_UNVERIFIED: '현재 로그인과 이 기록의 연결을 확인할 수 없습니다.',
        CANCELLED: '설명 요청을 취소했습니다. 이전 설명은 현재 결과가 아닙니다.',
        WB_CLCO_CANCELLED: '설명 요청을 취소했습니다. 이전 설명은 현재 결과가 아닙니다.',
        REQUEST_CANCELLED: '설명 요청을 취소했습니다. 이전 설명은 현재 결과가 아닙니다.',
      })[code] ?? null;

      // 오류 안내를 사건 선택 여부나 기본 문구보다 먼저 표시한다(event가 null이어도).
      if (status === 'error') {
        const code = safeErrorText(explanation?.error?.code, 'AI_REQUEST_UNVERIFIED');
        const message = safeErrorText(explanation?.error?.message, 'AI 설명 응답을 확인할 수 없습니다.');
        return renderFailure('설명을 받지 못했습니다', code, message, failureReason(code));
      }
      if (!eventId) {
        root.append(make('p', '보안 기록에서 기록을 먼저 고르세요. 기록을 고른 뒤 「AI 설명 요청」을 직접 누르면 설명을 요청합니다.', 'state state-empty'));
        return root;
      }
      if (!status || status === 'idle') {
        root.append(make('p', `사건 ${eventId}: 아직 AI 설명을 요청하지 않았습니다. 보안 기록에서 「AI 설명 요청」을 직접 누르세요.`, 'state state-empty'));
        return root;
      }
      if (status === 'loading') {
        root.append(make('p', `사건 ${eventId}: AI 설명 요청 중…`, 'state state-loading'));
        return root;
      }
      if (status !== 'ok') {
        root.append(make('p', `사건 ID: ${eventId}`));
        root.append(make('p', '확인 불가: AI 설명 응답 상태를 확인할 수 없습니다.', 'state state-empty'));
        root.append(make('p', KEEP_RECORDS));
        return root;
      }

      // 성공 응답이라도 지금 고른 기록의 근거와 맞는지 다시 대조한다. 맞지 않으면 쓰지 않고 지어내지 않는다.
      const data = explanation.data;
      const evidence = Array.isArray(event.evidence) ? event.evidence : [];
      const evidenceById = new Map(evidence.filter((row) => typeof row?.id === 'string').map((row) => [row.id, row]));
      const cited = Array.isArray(data?.evidenceIds) ? data.evidenceIds : [];
      const missing = cited.filter((id) => !evidenceById.has(id));
      const proposals = Array.isArray(data?.proposals) ? data.proposals : [];
      const supported = Array.isArray(event.supportedActions) ? event.supportedActions : [];
      const MISMATCH = 'ON_AI_EVIDENCE_MISMATCH';
      if (typeof data?.summary !== 'string' || data.summary.length === 0) {
        return renderFailure('설명 내용을 확인할 수 없습니다', 'ON_AI_INVALID_OUTPUT', 'AI 요약이 비어 있습니다.', '설명 형식이 맞지 않아 쓸 수 없습니다.');
      }
      if (data.executed !== false || data.requiresHumanConfirmation !== true) {
        return renderFailure('쓸 수 없는 설명입니다', 'ON_AI_INVALID_OUTPUT', 'AI가 이미 실행했다고 답했거나 사람 확인이 필요하다는 표시가 없습니다.', 'AI 설명은 조치를 실행하지 않아야 하므로 이 설명은 쓸 수 없습니다.');
      }
      if (cited.length === 0) {
        return renderFailure('근거가 부족합니다', MISMATCH, 'AI 설명이 인용한 근거 ID가 없습니다.', '근거 없는 설명은 쓸 수 없습니다.');
      }
      if (missing.length > 0) {
        return renderFailure('근거가 맞지 않습니다', MISMATCH, `이 기록(${eventId})에 없는 근거 ID: ${missing.map((id) => String(id)).join(', ')}`, '다른 기록의 설명이거나 근거가 맞지 않아 쓸 수 없습니다.');
      }
      const badProposal = proposals.find((p) => !supported.includes(p?.action)
        || !Array.isArray(p?.evidenceIds) || p.evidenceIds.length === 0 || p.evidenceIds.some((id) => !evidenceById.has(id)));
      if (badProposal) {
        return renderFailure('제안이 기록과 맞지 않습니다', MISMATCH, `지원하지 않는 조치이거나 근거가 맞지 않는 제안: ${String(badProposal?.action ?? '확인 불가')}`, '이 기록에 맞지 않는 제안이 있어 설명 전체를 쓸 수 없습니다.');
      }

      // 여기까지 오면 근거가 이 기록과 맞는 성공한 설명이다. 성공 표식은 이때만 붙인다.
      root.dataset.studentExplanationEvent = eventId;
      root.append(make('p', `사건 ID: ${eventId}`));
      root.append(make('h3', 'AI 설명(참고용)'));
      root.append(make('p', data.summary));
      root.append(make('p', 'AI 설명은 해석입니다. 사실 판단은 아래 근거 글과 연동 시스템이 알려 준 상태로 하세요.', 'muted'));

      const addList = (title, rows) => {
        root.append(make('h4', title));
        if (rows.length === 0) {
          root.append(make('p', '없음', 'muted'));
          return;
        }
        const list = make('ul');
        for (const row of rows) list.append(make('li', row.text, row.className));
        root.append(list);
      };
      addList('인용한 근거', cited.map((id) => ({ text: `${id} — ${evidenceById.get(id)?.text ?? ''}` })));
      addList('규칙', (Array.isArray(event.rules) ? event.rules : [])
        .map((rule) => ({ text: `${rule?.id ?? 'ID 없음'} — ${rule?.text ?? '내용 없음'}` })));

      // unknown 상태는 확인 불가로 나열한다. 정상·안전으로 바꾸지 않는다.
      const stateNames = [['access', '접속'], ['session', '세션'], ['device', '기기']];
      addList('확인 불가 상태', stateNames
        .filter(([key]) => event.state?.[key] === 'unknown' || typeof event.state?.[key] !== 'string')
        .map(([, name]) => ({ text: `${name}: 확인 불가(unknown)`, className: 'state state-empty' })));

      root.append(make('h4', 'AI 제안'));
      if (proposals.length === 0) {
        root.append(make('p', supported.length === 0
          ? '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).'
          : 'AI가 제안한 조치가 없습니다.', 'muted'));
      } else {
        const list = make('ul');
        for (const proposal of proposals) {
          list.append(make('li', `${proposal.action} — ${typeof proposal.reason === 'string' ? proposal.reason : '이유 없음'} (근거 ${proposal.evidenceIds.join(', ')}) · 사람 확인이 필요하며 실행되지 않았습니다.`));
        }
        root.append(list);
      }
      root.append(make('p', `설명 확인 시각: ${typeof checkedAt === 'string' && checkedAt ? checkedAt : '확인 불가'}`));
      root.append(make('p', 'AI 설명·제안만으로 보안 조치가 실행되지 않습니다.', 'muted'));
      return root;
    },
    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      // 호출마다 새 요소를 만든다. 새 값이 오면 이전 대상·요청·결과 표시는 남지 않는다.
      // 학생 코드는 조치 버튼·POST 요청·확인 티켓을 만들지 않는다. 조작은 제공 화면 버튼으로만 한다.
      const root = document.createElement('section');
      root.className = 'student-action';

      const make = (tag, text, className) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
      };
      const text = (value) => typeof value === 'string' && value.length > 0 ? value : null;
      const RESULT_RELOAD = '결과 확인은 위 「조치 준비와 원천 결과」 칸의 「원천 결과만 재조회」(연동 시스템 결과 재조회) 버튼을 직접 누르세요. 다시 집행하지 마세요.';
      const NOT_UNDO = '「조치 화면 취소」는 화면만 닫으며, 이미 서버에 전달된 조치 효과를 되돌리지 않습니다.';

      const head = (label, className) => root.append(make('p', `조치 상태: ${label}`, className));
      const note = (value, className) => root.append(make('p', value, className));

      // 접수 정보가 지금 사건·조치의 것인지 대조한다. 다르면 그 결과를 현재 결과로 쓰지 않는다.
      const eventId = text(event?.id);
      const intentMismatch = Boolean(receipt) && (
        (text(receipt.eventId) && eventId && receipt.eventId !== eventId)
        || (text(receipt.actionId) && text(actionId) && receipt.actionId !== actionId));
      if (intentMismatch && !['idle', 'loading', 'error'].includes(status)) {
        note('접수 정보의 사건·조치가 지금 화면의 사건·조치와 맞지 않습니다. 이 결과는 현재 결과로 쓰지 않습니다.', 'state state-error');
        status = 'unknown';
      }

      if (!status || status === 'idle') {
        head('아직 미실행(idle)', 'state state-empty');
        note(text(message) ?? '조치 제안은 아직 실행되지 않았습니다.');
        note('조치는 AI 제안에서 「조치 준비」를 누른 뒤, 실제 대상과 확인 기한을 읽고 「대상과 조치를 확인했으며 집행합니다」를 직접 눌러야 서버에 전달됩니다. 지금 기록처럼 연동 시스템이 지원하는 조치가 없으면 조치 준비 버튼이 나오지 않으며, 이것이 정상입니다.', 'muted');
      } else if (status === 'loading') {
        head('조치 준비 또는 결과 조회 중(loading) · 미실행', 'state state-loading');
        note('아직 결과가 없습니다. 이 화면만으로 조치가 실행되지 않습니다.');
      } else if (status === 'prepared') {
        head('준비됨·미실행(prepared)', 'state state-empty');
        note(`사람 확인 기한: ${text(confirmationExpiresAt) ?? '확인 불가'}`);
        note('아직 서버에 집행을 전달하지 않았습니다. 아래 사건·근거·조치·실제 대상을 읽고, 맞으면 제공 화면의 「대상과 조치를 확인했으며 집행합니다」를 직접 누르세요. 기한이 지나면 다시 준비해야 합니다.');
      } else if (status === 'executing') {
        head('서버에 전달 중(executing)', 'state state-loading');
        note('결과가 아직 없습니다. 완료 아님: 서버가 받았는지, 효과가 적용됐는지 아직 확인되지 않았습니다. 버튼을 다시 누르지 마세요.');
      } else if (status === 'pending') {
        head('서버 접수·처리 중(pending)', 'state state-loading');
        note('서버가 요청을 받았다는 응답(ACK)일 뿐 효과가 아닙니다. 완료 아님: 연동 시스템이 효과를 확인하지 않았습니다.');
        note(RESULT_RELOAD);
      } else if (status === 'succeeded' && observation?.effectApplied === true) {
        // 연동 시스템이 효과를 관측했을 때만 효과 확인으로 표시한다.
        head('효과 확인(succeeded)', 'state state-ok');
        note(`관측 시각: ${text(observation.observedAt) ?? '확인 불가'}`);
        note('effectApplied: true');
        note(`receiptId: ${text(receipt?.receiptId) ?? '확인 불가'}`);
      } else if (status === 'succeeded' || status === 'unknown') {
        // succeeded라도 effectApplied가 true가 아니면 성공으로 보지 않는다.
        head('결과 불명(unknown)', 'state state-empty');
        note('효과 없음으로도, 성공으로도 판단하지 마세요. 연동 시스템의 효과 관측이 확인되지 않았습니다.');
        if (status === 'succeeded') note(`서버 상태는 succeeded였지만 effectApplied: ${observation?.effectApplied === false ? 'false' : '확인 불가'} 이므로 효과 확인으로 표시하지 않습니다.`);
        if (receipt?.superseded === true) note('같은 사건에 더 새로운 요청이 있어 이 요청의 결과는 현재 결과가 아닙니다.');
        note(RESULT_RELOAD);
      } else if (status === 'denied') {
        head('거절(denied)', 'state state-error');
        note(`내용: ${text(message) ?? '연동 시스템이 조치를 거절했습니다.'}`);
        note('효과는 적용되지 않았습니다. 같은 요청을 반복하지 마세요.');
      } else if (status === 'failed') {
        head('실패(failed)', 'state state-error');
        note(`내용: ${text(message) ?? '연동 시스템에서 조치가 실패했습니다.'}`);
        note('효과가 적용되었다고 판단하지 마세요. 필요하면 결과를 재조회하거나 담당자에게 확인하세요.');
      } else if (status === 'expired') {
        head('확인 기한 지남(expired)', 'state state-empty');
        note('사람 확인 기한이 지나 집행할 수 없습니다. 필요하면 AI 제안에서 「조치 준비」부터 다시 하세요.');
        if (text(error?.message)) note(`내용: ${error.message}`);
      } else {
        // error 또는 알 수 없는 status: 요청이 처리되지 않았다는 것만 알린다.
        head(status === 'error' ? '요청 처리 안 됨(error)' : `확인 불가(${String(status)})`, 'state state-error');
        note(`오류 코드: ${text(error?.code) ?? '확인 불가'}`);
        note(`내용: ${text(error?.message) ?? text(message) ?? '서버가 오류 내용을 제공하지 않았습니다.'}`);
        note('조치가 실행되었다고도, 실행되지 않았다고도 단정하지 마세요. 결과가 필요하면 재조회하세요.');
      }

      // 받은 범위의 식별값만 글자로 보여 준다. 없는 값은 만들지 않는다(확인 번호는 입력에 없다).
      const ids = [];
      if (eventId) ids.push(['사건 ID(event.id)', eventId]);
      const evidenceIds = Array.isArray(event?.evidence) ? event.evidence.map((row) => text(row?.id)).filter(Boolean) : [];
      if (evidenceIds.length > 0) ids.push(['근거 ID', evidenceIds.join(', ')]);
      if (text(actionId)) ids.push(['조치(actionId)', actionId]);
      if (text(target?.id)) ids.push(['실제 대상(target.id)', target.id]);
      if (Number.isSafeInteger(target?.generation)) ids.push(['대상 세대(target.generation)', String(target.generation)]);
      if (text(receipt?.requestId)) ids.push(['요청 ID(requestId)', receipt.requestId]);
      if (text(receipt?.receiptId)) ids.push(['접수 ID(receiptId)', receipt.receiptId]);
      if (Number.isSafeInteger(receipt?.version)) ids.push(['버전(version)', String(receipt.version)]);
      if (ids.length > 0) {
        root.append(make('h4', '현재 조치 정보'));
        const list = make('dl', null, 'kv');
        for (const [name, value] of ids) list.append(make('dt', name), make('dd', value));
        root.append(list);
      }
      if (receipt?.replayed === true) {
        note('replayed: true — 같은 요청 ID로 이미 접수된 결과를 다시 받은 것이며, 새로 한 번 더 집행하지 않았습니다.', 'muted');
      }
      if (status && status !== 'idle') note(NOT_UNDO, 'muted');

      // 그린 화면의 바깥 요소에 현재 사건과 요청을 표시한다. 맞지 않는 접수 정보의 요청 ID는 붙이지 않는다.
      if (eventId) root.dataset.studentActionEvent = eventId;
      if (text(receipt?.requestId) && !intentMismatch) root.dataset.studentActionRequest = receipt.requestId;
      return root;
    },
  };
}
