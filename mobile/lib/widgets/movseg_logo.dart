import 'package:flutter/material.dart';

class MovSegLogo extends StatelessWidget {
  const MovSegLogo({super.key, required this.width, required this.height});

  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Image.asset(
        'assets/movseg-logo.png',
        width: width,
        height: height,
        alignment: const Alignment(0, 0.34),
        fit: BoxFit.cover,
        semanticLabel: 'MovSeg',
      ),
    );
  }
}
