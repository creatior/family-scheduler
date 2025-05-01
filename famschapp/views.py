from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import authenticate, login
from .serializers import EventSerializer
from django.utils import timezone
from django.db import models
from datetime import timedelta
from .models import Event, Family

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "User created successfully!",
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginAPI(generics.GenericAPIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })
        return Response({"error": "Invalid credentials"}, status=400)
    
class EventListCreateAPI(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Получаем события пользователя и события из его семей
        return Event.objects.filter(
            models.Q(creator=user) | 
            models.Q(family__members=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class WeekEventsAPI(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        week_start = timezone.now() - timedelta(days=timezone.now().weekday())
        week_end = week_start + timedelta(days=7)
        return Event.objects.filter(
            (models.Q(creator=user) | models.Q(family__members=user)),
            start_time__gte=week_start,
            start_time__lte=week_end
        ).distinct().order_by('start_time') 
    
class FamilyMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family = request.user.families.first()
        if not family:
            return Response([])
        
        members = family.members.all()
        serializer = UserSerializer(members, many=True)
        return Response(serializer.data)