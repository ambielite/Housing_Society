part of '../dashboard/screens/security_dashboard_screen.dart';

class _SecurityGateLogScreen extends StatelessWidget {
  const _SecurityGateLogScreen({required this.owner, required this.data});

  final _SecurityHomeState owner;
  final _GuardSnapshot data;

  @override
  Widget build(BuildContext context) => owner._gateLog(data);
}

extension _SecurityGateLogBuilder on _SecurityHomeState {
  Widget _gateLog(_GuardSnapshot data) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _sectionHeading('Recent gate log', '${data.events.length} events'),
      const SizedBox(height: 12),
      if (data.events.isEmpty)
        _emptyCard('Gate entries and exits will appear here.')
      else
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 15),
          decoration: _cardDecoration(),
          child: Column(
            children: data.events.take(60).map((event) {
              final pass = data.passById[event.passId];
              final isEntry = event.type == 'ENTRY';
              return _logRow(
                isEntry ? Icons.login_rounded : Icons.logout_rounded,
                isEntry ? 'Visitor entry' : 'Visitor exit',
                '${pass == null ? 'Pass' : _visitorName(pass, data)}  ·  ${data.gateName(event.gateId)}',
                _formatDate(event.at),
                isEntry ? _residentActionGreen : const Color(0xFFD65A54),
              );
            }).toList(),
          ),
        ),
    ],
  );
}
